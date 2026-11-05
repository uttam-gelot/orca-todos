import { describe, expect, test } from 'bun:test'
import { RUN_INDEX_KEY } from '../../src/agents'
import { HandlerError } from '../../src/errors'
import { TODO_KEY, type Todo } from '../../src/model'
import { REQUEST, type WorkspaceOption } from '../../src/protocol'
import {
  focusedWorkspaceId,
  launchAgent,
  listWorkspaces,
  onAgentStatus,
  parseStatusEvent
} from '../../src/worker/handlers'
import activate from '../../src/worker/main'
import { makeTodo } from '../factories/todo'
import { createFakeWorkerOrca } from '../factories/worker-orca'

const ws = (id: string, name: string, branch: string | null = 'main'): WorkspaceOption => ({
  id,
  name,
  kind: branch ? 'worktree' : 'folder',
  branch,
  folder: ''
})

describe('focusedWorkspaceId', () => {
  const list = [ws('a', 'app', 'refs/heads/main'), ws('b', 'app', 'feature/x'), ws('c', 'notes', null)]

  test('matches name and branch, with or without refs/heads/', () => {
    expect(focusedWorkspaceId(list, { displayName: 'app', branch: 'main' })).toBe('a')
    expect(focusedWorkspaceId(list, { displayName: 'notes', branch: '' })).toBe('c')
  })
  test('is null when nothing or several match', () => {
    expect(focusedWorkspaceId(list, null)).toBeNull()
    expect(focusedWorkspaceId(list, { displayName: 'other', branch: 'main' })).toBeNull()
    expect(focusedWorkspaceId([...list, ws('d', 'app', 'main')], { displayName: 'app', branch: 'main' })).toBeNull()
  })
})

describe('listWorkspaces', () => {
  test('answers the usable workspaces and the focused one', async () => {
    const orca = createFakeWorkerOrca({
      'workspace.list': () => ({
        workspaces: [
          { id: 'w1', kind: 'worktree', name: 'app', branch: 'main', path: '/src/app/', hostId: null },
          { name: 'no id' }
        ],
        truncated: true
      }),
      'workspace.readContext': () => ({ displayName: 'app', branch: 'refs/heads/main', terminals: [] })
    })
    expect(await listWorkspaces(orca)).toEqual({
      workspaces: [{ ...ws('w1', 'app', 'main'), folder: 'app' }],
      focusedId: 'w1',
      truncated: true
    })
  })
  test('fails with action_failed on an unexpected answer', async () => {
    const orca = createFakeWorkerOrca({ 'workspace.list': () => null, 'workspace.readContext': () => null })
    const error = await listWorkspaces(orca).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(HandlerError)
    expect((error as HandlerError).code).toBe('action_failed')
  })
})

describe('launchAgent', () => {
  const input = { todoId: 'a', workspaceId: 'w1', agent: 'claude', prompt: '# Fix login' }
  const launched = () => createFakeWorkerOrca({ 'agent.launch': () => ({ terminalId: 't9' }) })

  test('starts the agent without the to-do id and indexes its terminal', async () => {
    const orca = launched()
    orca.stored.set(RUN_INDEX_KEY, { t1: 'b' })
    expect(await launchAgent(orca, input)).toEqual({ terminalId: 't9' })
    expect(orca.calls[0]).toEqual({
      method: 'agent.launch',
      params: { workspaceId: 'w1', agent: 'claude', prompt: '# Fix login' }
    })
    expect(orca.stored.get(RUN_INDEX_KEY)).toEqual({ t1: 'b', t9: 'a' })
  })
  test('still answers the terminal when the index cannot be written', async () => {
    const orca = launched()
    orca.answers.delete('storage.set')
    expect(await launchAgent(orca, input)).toEqual({ terminalId: 't9' })
    expect(orca.logs.at(-1)).toContain('Could not index terminal t9')
  })
  test('refuses input that is not a launch, without calling Orca', async () => {
    const orca = launched()
    for (const bad of [null, { ...input, prompt: '  ' }, { ...input, workspaceId: 3 }, { ...input, todoId: '' }]) {
      const error = await launchAgent(orca, bad).catch((e: unknown) => e)
      expect((error as HandlerError).code).toBe('invalid_params')
    }
    expect(orca.calls).toEqual([])
  })
  test('never logs the prompt', async () => {
    const orca = launched()
    await launchAgent(orca, input)
    expect(orca.logs.join('\n')).not.toContain('Fix login')
  })
})

describe('parseStatusEvent', () => {
  test('keeps the terminal, state and time', () => {
    expect(parseStatusEvent({ paneKey: 'p', terminalId: 't1', state: 'blocked', receivedAt: 5 })).toEqual({
      terminalId: 't1',
      state: 'blocked',
      at: 5
    })
  })
  test('is null without a terminal or with an unknown state', () => {
    expect(parseStatusEvent({ paneKey: 'p', state: 'working', receivedAt: 5 })).toBeNull()
    expect(parseStatusEvent({ terminalId: 't1', state: 'starting', receivedAt: 5 })).toBeNull()
  })
})

describe('onAgentStatus', () => {
  const run = {
    terminalId: 't1',
    agent: 'claude',
    workspaceId: 'w1',
    workspaceName: 'app',
    startedAt: 1,
    state: 'starting',
    stateAt: 1
  } as const
  const seeded = () => {
    const orca = createFakeWorkerOrca()
    orca.stored.set(RUN_INDEX_KEY, { t1: 'a' })
    orca.stored.set(`${TODO_KEY}a`, makeTodo({ id: 'a', updatedAt: 1, runs: [run] }))
    return orca
  }
  const event = (state: string, terminalId = 't1') => ({
    paneKey: 'p',
    terminalId,
    state,
    receivedAt: 9,
    workspaceId: 'w1'
  })

  test('records the new state on the run, leaving updatedAt alone', async () => {
    const orca = seeded()
    await onAgentStatus(orca, event('working'))
    const todo = orca.stored.get(`${TODO_KEY}a`) as Todo
    expect(todo.runs).toEqual([{ ...run, state: 'working', stateAt: 9 }])
    expect(todo.updatedAt).toBe(1)
  })
  test('ignores terminals it did not start and states that did not change', async () => {
    const orca = seeded()
    await onAgentStatus(orca, event('working', 'other'))
    await onAgentStatus(orca, event('starting'))
    expect(orca.calls.filter((c) => c.method === 'storage.set')).toEqual([])
  })
  test('ignores a to-do that is gone', async () => {
    const orca = seeded()
    orca.stored.delete(`${TODO_KEY}a`)
    await onAgentStatus(orca, event('done'))
    expect(orca.calls.filter((c) => c.method === 'storage.set')).toEqual([])
  })
})

describe('activate', () => {
  test('answers every request and follows agent status', () => {
    const orca = createFakeWorkerOrca()
    activate(orca)
    expect([...orca.handlers.keys()].sort()).toEqual(Object.values(REQUEST).sort())
    expect([...orca.listeners.keys()]).toEqual(['agent.status.changed'])
  })
})
