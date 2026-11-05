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
  openWorkspace,
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
  const input = { todoId: 'a', workspaceId: 'w1', agent: 'claude', prompt: "Fix Bob's login" }
  const launched = () =>
    createFakeWorkerOrca({
      'terminal.create': () => ({ terminalId: 't9' }),
      'agent.launch': () => ({ terminalId: 't8' })
    })

  test('starts a CLI that takes a prompt with it in the start command, and indexes the terminal', async () => {
    const orca = launched()
    orca.stored.set(RUN_INDEX_KEY, { t1: 'b' })
    expect(await launchAgent(orca, input, 'darwin')).toEqual({ terminalId: 't9', prompt: 'command' })
    expect(orca.calls[0]).toEqual({
      method: 'terminal.create',
      params: { workspaceId: 'w1', title: 'Claude', command: `claude 'Fix Bob'\\''s login'` }
    })
    expect(orca.stored.get(RUN_INDEX_KEY)).toEqual({ t1: 'b', t9: 'a' })
  })
  test('leaves typing the prompt to Orca for other CLIs and on Windows', async () => {
    const orca = launched()
    expect(await launchAgent(orca, { ...input, agent: 'aider' }, 'darwin')).toEqual({
      terminalId: 't8',
      prompt: 'typed'
    })
    expect(await launchAgent(orca, input, 'win32')).toEqual({ terminalId: 't8', prompt: 'typed' })
    const launches = orca.calls.filter((c) => c.method === 'agent.launch')
    expect(launches.map((c) => c.params)).toEqual([
      { workspaceId: 'w1', agent: 'aider', prompt: "Fix Bob's login" },
      { workspaceId: 'w1', agent: 'claude', prompt: "Fix Bob's login" }
    ])
  })
  test('still answers the terminal when the index cannot be written', async () => {
    const orca = launched()
    orca.answers.delete('storage.set')
    expect((await launchAgent(orca, input, 'darwin')).terminalId).toBe('t9')
    expect(orca.logs.at(-1)).toContain('Could not index terminal t9')
  })
  test('fails with action_failed when Orca answers without a terminal', async () => {
    const orca = createFakeWorkerOrca({ 'terminal.create': () => ({}) })
    const error = await launchAgent(orca, input, 'darwin').catch((e: unknown) => e)
    expect((error as HandlerError).code).toBe('action_failed')
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
    await launchAgent(orca, input, 'darwin')
    expect(orca.logs.join('\n')).not.toContain('login')
  })
})

describe('openWorkspace', () => {
  test('asks Orca to show the workspace', async () => {
    const orca = createFakeWorkerOrca({ 'workspace.open': () => ({ opened: true }) })
    expect(await openWorkspace(orca, { workspaceId: 'w1' })).toEqual({ opened: true })
    expect(orca.calls).toEqual([{ method: 'workspace.open', params: { workspaceId: 'w1' } }])
  })
  test('refuses input without a workspace, without calling Orca', async () => {
    const orca = createFakeWorkerOrca()
    for (const bad of [null, {}, { workspaceId: ' ' }]) {
      const error = await openWorkspace(orca, bad).catch((e: unknown) => e)
      expect((error as HandlerError).code).toBe('invalid_params')
    }
    expect(orca.calls).toEqual([])
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
