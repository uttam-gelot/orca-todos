import { beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { REQUEST } from '../../src/protocol'
import { agentChoice, loadWorkspaces, notice, openRun, sendToAgent, todos, workspaceList } from '../../src/store'
import { resetStore } from '../factories/store'
import { makeTodo } from '../factories/todo'
import { serveWorker } from '../factories/workspaces'
import { fakeOrca } from '../setup'

const byId = (id: string) => todos.value.find((t) => t.id === id)!

beforeEach(() => {
  fakeOrca.reset()
  resetStore({ todos: [makeTodo({ id: 'a' })] })
  serveWorker(fakeOrca)
})

describe('loadWorkspaces', () => {
  test('picks the focused workspace when none is remembered', async () => {
    await loadWorkspaces()
    expect(workspaceList.value.status).toBe('ready')
    expect(agentChoice.value.workspaceId).toBe('w2')
  })
  test('keeps a remembered workspace that is still listed', async () => {
    agentChoice.value = { agent: 'codex', workspaceId: 'w1' }
    await loadWorkspaces()
    expect(agentChoice.value).toEqual({ agent: 'codex', workspaceId: 'w1' })
  })
  test('shows why when the worker fails', async () => {
    fakeOrca.handlers.clear()
    const error = spyOn(console, 'error').mockImplementation(() => {})
    await loadWorkspaces()
    expect(workspaceList.value).toEqual({ status: 'error', message: expect.stringContaining('plugin worker') })
    error.mockRestore()
  })
})

describe('sendToAgent', () => {
  test('starts the agent, records the run and moves the to-do to In Progress', async () => {
    await loadWorkspaces()
    expect(await sendToAgent('a', 'Do it')).toBeNull()
    expect(fakeOrca.requests.at(-1)).toEqual({
      name: REQUEST.launch,
      input: { todoId: 'a', workspaceId: 'w2', agent: 'claude', prompt: 'Do it' }
    })
    const todo = byId('a')
    expect(todo.stateId).toBe('doing')
    expect(todo.runs).toEqual([
      expect.objectContaining({ terminalId: 't1', agent: 'claude', workspaceId: 'w2', state: 'starting' })
    ])
    expect(notice.value?.text).toBe('Started Claude in app · feature/login')
  })
  test('leaves a to-do that is already further along where it is', async () => {
    resetStore({ todos: [makeTodo({ id: 'a', stateId: 'done' })] })
    await loadWorkspaces()
    await sendToAgent('a', 'Do it')
    expect(byId('a').stateId).toBe('done')
    expect(byId('a').runs).toHaveLength(1)
  })
  test('answers an error and changes nothing when Orca refuses', async () => {
    await loadWorkspaces()
    fakeOrca.handlers.set(REQUEST.launch, () => {
      throw Object.assign(new Error('no'), { code: 'not_permitted' })
    })
    const error = spyOn(console, 'error').mockImplementation(() => {})
    expect(await sendToAgent('a', 'Do it')).toContain('did not allow')
    expect(byId('a')).toEqual(makeTodo({ id: 'a' }))
    error.mockRestore()
  })
  test('refuses an empty prompt without asking the worker', async () => {
    await loadWorkspaces()
    const before = fakeOrca.requests.length
    expect(await sendToAgent('a', '   ')).not.toBeNull()
    expect(fakeOrca.requests).toHaveLength(before)
  })
})

describe('openRun', () => {
  const run = {
    terminalId: 't1',
    agent: 'claude',
    workspaceId: 'w1',
    workspaceName: 'app',
    startedAt: 1,
    state: 'working',
    stateAt: 1
  } as const

  test("asks the worker to show the run's workspace", async () => {
    await openRun(run)
    expect(fakeOrca.requests).toEqual([{ name: REQUEST.open, input: { workspaceId: 'w1' } }])
    expect(notice.value).toBeNull()
  })
  test('tells the person when Orca will not open it', async () => {
    fakeOrca.handlers.set(REQUEST.open, () => {
      throw Object.assign(new Error('no'), { code: 'action_failed' })
    })
    const error = spyOn(console, 'error').mockImplementation(() => {})
    await openRun(run)
    expect(notice.value).toEqual({ text: 'Could not open the workspace. Try again.', error: true })
    error.mockRestore()
  })
})
