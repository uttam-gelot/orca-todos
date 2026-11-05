import { describe, expect, test } from 'bun:test'
import {
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
