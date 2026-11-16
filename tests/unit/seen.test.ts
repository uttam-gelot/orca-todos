import { describe, expect, test } from 'bun:test'
import type { AgentRun } from '../../src/model'
import { isUnseen, markSeen, parseSeen } from '../../src/seen'
import { makeTodo } from '../factories/todo'

const run = (state: AgentRun['state'], stateAt: number): AgentRun => ({
  terminalId: 't1',
  agent: 'claude',
  workspaceId: 'w1',
  workspaceName: 'app',
  startedAt: 0,
  state,
  stateAt
})

describe('isUnseen', () => {
  const seen = { since: 100, todos: { a: 200 } }

  test('a run that needs you, waits or finished after the last look is unseen', () => {
    expect(isUnseen(makeTodo({ id: 'a', runs: [run('done', 300)] }), seen)).toBe(true)
    expect(isUnseen(makeTodo({ id: 'a', runs: [run('blocked', 300)] }), seen)).toBe(true)
  })

  test('a change before the last look, or before tracking began, is seen', () => {
    expect(isUnseen(makeTodo({ id: 'a', runs: [run('done', 150)] }), seen)).toBe(false)
    expect(isUnseen(makeTodo({ id: 'b', runs: [run('done', 50)] }), seen)).toBe(false)
    expect(isUnseen(makeTodo({ id: 'b', runs: [run('done', 150)] }), seen)).toBe(true)
  })

  test('a working run, or no run, asks for no look', () => {
    expect(isUnseen(makeTodo({ id: 'a', runs: [run('working', 300)] }), seen)).toBe(false)
    expect(isUnseen(makeTodo({ id: 'a' }), seen)).toBe(false)
  })
})

describe('parseSeen', () => {
  test('keeps valid times and drops the rest', () => {
    expect(parseSeen({ since: 5, todos: { a: 7, b: 'x' } }, 9)).toEqual({ since: 5, todos: { a: 7 } })
  })

  test('starts over from now when the value is unusable', () => {
    expect(parseSeen(null, 9)).toEqual({ since: 9, todos: {} })
    expect(parseSeen({ since: 'x', todos: {} }, 9)).toEqual({ since: 9, todos: {} })
  })
})

describe('markSeen', () => {
  test('records the time and keeps only the newest 200 to-dos', () => {
    const many = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`t${i}`, i]))
    const next = markSeen({ since: 0, todos: many }, 'new', 1000)
    expect(next.todos.new).toBe(1000)
    expect(Object.keys(next.todos)).toHaveLength(200)
    expect(next.todos.t0).toBeUndefined()
  })
})
