import { describe, expect, test } from 'bun:test'
import { HandlerError } from '../../src/errors'
import { REQUEST, type WorkspaceOption } from '../../src/protocol'
import { focusedWorkspaceId, launchAgent, listWorkspaces } from '../../src/worker/handlers'
import activate from '../../src/worker/main'
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
  const input = { workspaceId: 'w1', agent: 'claude', prompt: '# Fix login' }

  test('starts the agent and answers its terminal', async () => {
    const orca = createFakeWorkerOrca({ 'agent.launch': () => ({ terminalId: 't9' }) })
    expect(await launchAgent(orca, input)).toEqual({ terminalId: 't9' })
    expect(orca.calls).toEqual([{ method: 'agent.launch', params: input }])
  })
  test('refuses input that is not a launch, without calling Orca', async () => {
    const orca = createFakeWorkerOrca({ 'agent.launch': () => ({ terminalId: 't9' }) })
    for (const bad of [null, { ...input, prompt: '  ' }, { ...input, workspaceId: 3 }]) {
      const error = await launchAgent(orca, bad).catch((e: unknown) => e)
      expect((error as HandlerError).code).toBe('invalid_params')
    }
    expect(orca.calls).toEqual([])
  })
  test('never logs the prompt', async () => {
    const orca = createFakeWorkerOrca({ 'agent.launch': () => ({ terminalId: 't9' }) })
    await launchAgent(orca, input)
    expect(orca.logs.join('\n')).not.toContain('Fix login')
  })
})

describe('activate', () => {
  test('registers a handler for every request', () => {
    const orca = createFakeWorkerOrca()
    activate(orca)
    expect([...orca.handlers.keys()].sort()).toEqual(Object.values(REQUEST).sort())
  })
})
