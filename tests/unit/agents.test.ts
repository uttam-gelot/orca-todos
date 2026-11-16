import { describe, expect, test } from 'bun:test'
import {
  agentErrorText,
  shellQuote,
  startCommand,
  indexRun,
  MAX_INDEXED_RUNS,
  parseRunIndex,
  workspaceLabel,
  groupWorkspaces,
  workspaceTitle,
  addRun,
  agentLabel,
  buildPrompt,
  latestRun,
  MAX_RUNS,
  stateAfterSend,
  withRunState,
  workingStateId
} from '../../src/agents'
import { DEFAULT_STATES, type AgentRun, type State } from '../../src/model'
import type { WorkspaceOption } from '../../src/protocol'
import { makeTodo as todo } from '../factories/todo'
import { CUSTOM_STATES } from '../fixtures/stored-records'

const run = (over: Partial<AgentRun> = {}): AgentRun => ({
  terminalId: 't1',
  agent: 'claude',
  workspaceId: 'wt-1',
  workspaceName: 'orca-todos',
  startedAt: 1,
  state: 'starting',
  stateAt: 1,
  ...over
})

describe('buildPrompt', () => {
  test('puts the title, notes, tags and priority in markdown', () => {
    const prompt = buildPrompt(
      todo({ title: 'Fix login', description: ' Steps\n', tags: ['api', 'bug'], priority: 'med' })
    )
    expect(prompt).toBe('# Fix login\n\nSteps\n\nTags: #api #bug\nPriority: Medium')
  })
  test('leaves out empty notes and no priority', () => {
    expect(buildPrompt(todo({ title: 'Ship it', description: '' }))).toBe('# Ship it')
  })
})

describe('agentLabel', () => {
  test('names a known agent and falls back to the id', () => {
    expect(agentLabel('codex')).toBe('Codex')
    expect(agentLabel('jcode')).toBe('jcode')
  })
})

describe('workingStateId', () => {
  test('is the last open state before the first closed one', () => {
    expect(workingStateId(DEFAULT_STATES)).toBe('doing')
    expect(workingStateId(CUSTOM_STATES)).toBe('open')
  })
  test('is the last state when none is closed, and null when all are', () => {
    const open: State[] = DEFAULT_STATES.map((s) => ({ ...s, closed: false }))
    expect(workingStateId(open)).toBe('done')
    expect(workingStateId(DEFAULT_STATES.map((s) => ({ ...s, closed: true })))).toBeNull()
  })
})

describe('stateAfterSend', () => {
  test('moves a to-do from an earlier state to the working state', () => {
    expect(stateAfterSend(todo({ stateId: 'backlog' }), DEFAULT_STATES)).toBe('doing')
  })
  test('leaves a to-do that is already working or further along', () => {
    expect(stateAfterSend(todo({ stateId: 'doing' }), DEFAULT_STATES)).toBeNull()
    expect(stateAfterSend(todo({ stateId: 'done' }), DEFAULT_STATES)).toBeNull()
  })
})

describe('runs', () => {
  test('adds newest last and keeps at most MAX_RUNS', () => {
    const many = Array.from({ length: MAX_RUNS }, (_, i) => run({ terminalId: `t${i}` }))
    const next = addRun(many, run({ terminalId: 'new' }))
    expect(next).toHaveLength(MAX_RUNS)
    expect(next[0].terminalId).toBe('t1')
    expect(latestRun(todo({ runs: next }))?.terminalId).toBe('new')
  })
  test('changes the state of the run with that terminal', () => {
    expect(withRunState([run()], 't1', 'working', 9)).toEqual([run({ state: 'working', stateAt: 9 })])
  })
  test('answers null for an unknown terminal or an unchanged state', () => {
    expect(withRunState([run()], 'other', 'working', 9)).toBeNull()
    expect(withRunState([run()], 't1', 'starting', 9)).toBeNull()
  })
})

describe('groupWorkspaces', () => {
  const ws = (id: string, project: string | null, folder: string, name = 'main'): WorkspaceOption => ({
    id,
    kind: 'worktree',
    name,
    branch: name,
    folder,
    project
  })
  test("heads each group with Orca's project, in Orca's order", () => {
    const groups = groupWorkspaces([ws('a', 'web', 'web'), ws('b', 'api', 'api'), ws('c', 'web', 'web-2', 'feat')])
    expect(groups.map((g) => [g.name, g.workspaces.map((w) => w.id)])).toEqual([
      ['web', ['a', 'c']],
      ['api', ['b']]
    ])
  })
  test('falls back to the folder, then the name, when Orca sends no project', () => {
    expect(groupWorkspaces([ws('a', null, 'backup')])[0].name).toBe('backup')
    expect(groupWorkspaces([ws('a', null, '', 'Notes')])[0].name).toBe('Notes')
  })
})

describe('workspaceLabel', () => {
  const ws = (name: string, branch: string | null): WorkspaceOption => ({
    id: 'w',
    kind: 'worktree',
    name,
    branch,
    folder: 'app',
    project: 'app'
  })
  test('shows the branch once when the workspace is named after it', () => {
    expect(workspaceLabel(ws('main', 'refs/heads/main'))).toBe('main')
    expect(workspaceLabel(ws('feature/x', 'feature/x'))).toBe('feature/x')
  })
  test('adds the branch to a renamed workspace, and none to a folder', () => {
    expect(workspaceLabel(ws('Docs work', 'main'))).toBe('Docs work · main')
    expect(workspaceLabel(ws('Notes', null))).toBe('Notes')
  })
})

describe('workspaceTitle', () => {
  const ws = (name: string, branch: string | null, project: string | null): WorkspaceOption => ({
    id: 'w',
    kind: branch ? 'worktree' : 'folder',
    name,
    branch,
    folder: 'app',
    project
  })
  test('puts the project before the workspace', () => {
    expect(workspaceTitle(ws('feature/login', 'feature/login', 'web'))).toBe('web · feature/login')
    expect(workspaceTitle(ws('main', 'main', null))).toBe('app · main')
  })
  test('names a folder named after its project once', () => {
    expect(workspaceTitle(ws('Notes', null, 'Notes'))).toBe('Notes')
  })
})

describe('agentErrorText', () => {
  test('explains the codes a person can act on, and names any other', () => {
    expect(agentErrorText('not_permitted')).toContain('Approve')
    expect(agentErrorText('timeout')).toContain('in time')
    expect(agentErrorText('weird')).toContain('(weird)')
  })
})

describe('run index', () => {
  test('keeps only string to-do ids', () => {
    expect(parseRunIndex({ t1: 'a', t2: 3, t3: '' })).toEqual({ t1: 'a' })
    expect(parseRunIndex(null)).toEqual({})
    expect(parseRunIndex(['a'])).toEqual({})
  })
  test('adds the newest terminal last and drops the oldest past the cap', () => {
    let index = {}
    for (let i = 0; i <= MAX_INDEXED_RUNS; i++) index = indexRun(index, `t${i}`, 'a')
    const keys = Object.keys(index)
    expect(keys).toHaveLength(MAX_INDEXED_RUNS)
    expect(keys[0]).toBe('t1')
    expect(keys.at(-1)).toBe(`t${MAX_INDEXED_RUNS}`)
  })
})

describe('startCommand', () => {
  test('puts the prompt where each CLI takes it', () => {
    expect(startCommand('claude', 'Fix it')).toBe(`claude 'Fix it'`)
    expect(startCommand('gemini', 'Fix it')).toBe(`gemini --prompt-interactive 'Fix it'`)
    expect(startCommand('grok', '-x')).toBe(`grok -- '-x'`)
  })
  test('is null for a CLI that takes no prompt, or one it does not know', () => {
    expect(startCommand('aider', 'Fix it')).toBeNull()
    expect(startCommand('nope', 'Fix it')).toBeNull()
  })
  test('quotes so the shell expands nothing', () => {
    expect(shellQuote(`it's $HOME \`x\``)).toBe(`'it'\\''s $HOME \`x\`'`)
  })
})
