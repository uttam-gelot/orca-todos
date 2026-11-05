import { beforeEach, describe, expect, test } from 'bun:test'
import { AgentError } from '../../src/errors'
import {
  browserStorage,
  launchAgent,
  listWorkspaces,
  openExternal,
  openWorkspace,
  workerAvailable
} from '../../src/orca'
import { REQUEST } from '../../src/protocol'
import { fakeOrca } from '../setup'

beforeEach(() => {
  localStorage.clear()
  fakeOrca.reset()
})

describe('browserStorage (preview fallback)', () => {
  test('round-trips JSON values under a plugin prefix', async () => {
    await browserStorage.set('todo:a', { title: 'x' })
    expect(localStorage.getItem('orca-todos:todo:a')).toBe('{"title":"x"}')
    expect(await browserStorage.get('todo:a')).toEqual({ title: 'x' })
    expect(await browserStorage.get('missing')).toBeNull()
  })
  test('lists only its own keys, without the prefix', async () => {
    localStorage.setItem('other-app', '1')
    await browserStorage.set('states', [])
    expect(await browserStorage.keys()).toEqual(['states'])
  })
})

describe('openExternal', () => {
  test('hands links to Orca so they open in the OS browser', () => {
    openExternal('https://example.com/')
    expect(fakeOrca.opened).toEqual(['https://example.com/'])
  })
})

describe('worker requests', () => {
  const launch = { todoId: 'a', workspaceId: 'w1', agent: 'claude', prompt: 'Do it' }

  test('the worker is reachable inside Orca', () => {
    expect(workerAvailable()).toBe(true)
  })
  test('launchAgent sends the launch and answers the terminal', async () => {
    fakeOrca.handlers.set(REQUEST.launch, () => ({ terminalId: 't1', prompt: 'command' }))
    expect(await launchAgent(launch)).toEqual({ terminalId: 't1', prompt: 'command' })
    expect(fakeOrca.requests).toEqual([{ name: REQUEST.launch, input: launch }])
  })
  test('listWorkspaces drops a focused id that is not listed', async () => {
    fakeOrca.handlers.set(REQUEST.workspaces, () => ({
      workspaces: [{ id: 'w1', name: 'app', kind: 'worktree', branch: 'main' }],
      focusedId: 'gone',
      truncated: false
    }))
    expect((await listWorkspaces()).focusedId).toBeNull()
  })
  test('openWorkspace asks the worker to show a workspace', async () => {
    fakeOrca.handlers.set(REQUEST.open, () => ({ opened: true }))
    expect(await openWorkspace('w1')).toEqual({ opened: true })
    expect(fakeOrca.requests).toEqual([{ name: REQUEST.open, input: { workspaceId: 'w1' } }])
  })
  test("rejects with an AgentError carrying Orca's code", async () => {
    const error = await launchAgent(launch).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AgentError)
    expect((error as AgentError).code).toBe('unknown_method')
  })
  test('rejects an unusable answer as bad_answer', async () => {
    fakeOrca.handlers.set(REQUEST.launch, () => ({ terminalId: '' }))
    expect(((await launchAgent(launch).catch((e: unknown) => e)) as AgentError).code).toBe('bad_answer')
  })
})
