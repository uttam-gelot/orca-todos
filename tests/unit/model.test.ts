import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_STATES,
  EMPTY_FILTER,
  matches,
  normalizeTags,
  orderBefore,
  parseQuickAdd,
  parseStates,
  parseTodo,
  patchTodo,
  sortTodos,
  stats
} from '../../src/model'
import { makeTodo as todo } from '../factories/todo'
import { CUSTOM_STATES, INVALID_TODOS, LEGACY_TODO, ODD_RUNS, VALID_TODO } from '../fixtures/stored-records'

describe('normalizeTags', () => {
  test('splits, strips #, lowercases and dedupes', () => {
    expect(normalizeTags('#Bug, api  #bug')).toEqual(['bug', 'api'])
  })
})

describe('patchTodo', () => {
  test('sets closedAt entering a closed state and clears it leaving', () => {
    const done = patchTodo(todo(), { stateId: 'done' }, DEFAULT_STATES, 5)
    expect(done.closedAt).toBe(5)
    expect(patchTodo(done, { stateId: 'todo' }, DEFAULT_STATES, 6).closedAt).toBeUndefined()
  })
  test('keeps the original closedAt while staying closed', () => {
    const done = patchTodo(todo(), { stateId: 'done' }, DEFAULT_STATES, 5)
    expect(patchTodo(done, { title: 'x' }, DEFAULT_STATES, 9).closedAt).toBe(5)
  })
})

describe('matches', () => {
  test('text searches title and description', () => {
    expect(matches(todo(), { ...EMPTY_FILTER, text: 'example' })).toBe(true)
    expect(matches(todo(), { ...EMPTY_FILTER, text: 'nope' })).toBe(false)
  })
  test('requires every filter tag and hides archived by default', () => {
    const t = todo({ tags: ['bug', 'api'] })
    expect(matches(t, { ...EMPTY_FILTER, tags: ['bug', 'api'] })).toBe(true)
    expect(matches(t, { ...EMPTY_FILTER, tags: ['bug', 'ui'] })).toBe(false)
    expect(matches(todo({ archived: true }), EMPTY_FILTER)).toBe(false)
  })
})

describe('ordering', () => {
  const list = [todo({ id: 'a', order: 1 }), todo({ id: 'b', order: 2 }), todo({ id: 'c', order: 3 })]
  test('places before a todo, between its neighbours', () => {
    expect(orderBefore(list, 'todo', 'b')).toBe(1.5)
    expect(orderBefore(list, 'todo', 'a')).toBeLessThan(1)
  })
  test('appends when no target', () => {
    expect(orderBefore(list, 'todo', null)).toBe(4)
    expect(orderBefore(list, 'done', null)).toBe(1)
  })
  test('sorts by priority, then manual order', () => {
    const sorted = sortTodos([todo({ id: 'x', priority: 'low' }), todo({ id: 'y', priority: 'high' })], 'priority')
    expect(sorted.map((t) => t.id)).toEqual(['y', 'x'])
  })
})

describe('stats', () => {
  test('counts open, closed and done this week, excluding archived from totals', () => {
    const now = 10 * 24 * 60 * 60 * 1000
    const s = stats(
      [
        todo({ id: '1' }),
        todo({ id: '2', stateId: 'done', closedAt: now - 1000 }),
        todo({ id: '3', stateId: 'done', closedAt: now - 1000, archived: true }),
        todo({ id: '4', stateId: 'done', closedAt: 0 })
      ],
      DEFAULT_STATES,
      now
    )
    expect([s.total, s.open, s.closed, s.doneThisWeek]).toEqual([3, 1, 2, 2])
  })
})

describe('parseTodo', () => {
  test('accepts a complete stored todo unchanged', () => {
    expect(parseTodo(VALID_TODO)).toEqual(VALID_TODO as never)
  })
  test('fills defaults for fields older records do not have', () => {
    expect(parseTodo(LEGACY_TODO)).toMatchObject({ description: '', tags: [], priority: 'none', archived: false })
  })
  test('rejects values that are not usable todos', () => {
    for (const value of INVALID_TODOS) expect(parseTodo(value)).toBeNull()
  })
  test('keeps usable agent runs and drops the rest', () => {
    const runs = parseTodo({ ...VALID_TODO, runs: ODD_RUNS })?.runs
    expect(runs).toEqual([
      {
        terminalId: 't2',
        agent: 'codex',
        workspaceId: 'wt-1',
        workspaceName: 'x',
        startedAt: 5,
        state: 'starting',
        stateAt: 5
      }
    ])
  })
  test('gives a record without runs an empty list', () => {
    expect(parseTodo(LEGACY_TODO)?.runs).toEqual([])
  })
})

describe('parseStates', () => {
  test('accepts a stored state list', () => {
    expect(parseStates(CUSTOM_STATES)).toEqual(CUSTOM_STATES)
  })
  test('rejects an empty list, a malformed entry, or a non-array', () => {
    expect(parseStates([])).toBeNull()
    expect(parseStates([...CUSTOM_STATES, { id: 'x' }])).toBeNull()
    expect(parseStates({ states: CUSTOM_STATES })).toBeNull()
  })
})

describe('parseQuickAdd', () => {
  test('takes tags and a priority out of the title', () => {
    expect(parseQuickAdd('Fix login #auth #UI !high')).toEqual({
      title: 'Fix login',
      tags: ['auth', 'ui'],
      priority: 'high'
    })
  })

  test('reads the short priorities and keeps only the first one', () => {
    expect(parseQuickAdd('Ship it !l !h')).toEqual({ title: 'Ship it !h', tags: [], priority: 'low' })
  })

  test('keeps issue numbers, unknown marks, and words with # inside in the title', () => {
    expect(parseQuickAdd('Fix #123 now! !urgent C#')).toEqual({ title: 'Fix #123 now! !urgent C#', tags: [] })
  })

  test('ignores names on Object.prototype', () => {
    expect(parseQuickAdd('Read !constructor')).toEqual({ title: 'Read !constructor', tags: [] })
  })

  test('keeps the whole line as the title when only marks were typed', () => {
    expect(parseQuickAdd('#later !high')).toEqual({ title: '#later !high', tags: [] })
  })
})
