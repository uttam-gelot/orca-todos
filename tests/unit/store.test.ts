import { beforeEach, describe, expect, spyOn, test } from 'bun:test'
import {
  composerTarget,
  createTodo,
  cyclePriority,
  deleteState,
  deleteTodo,
  filter,
  lastDeleted,
  moveTodo,
  saveError,
  selectedId,
  states,
  todos,
  toggleDone,
  undoDelete
} from '../../src/store'
import { makeTodo } from '../factories/todo'
import { resetStore } from '../factories/store'
import { fakeOrca } from '../setup'

const byId = (id: string) => todos.value.find((t) => t.id === id)
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  fakeOrca.reset()
  resetStore()
})

describe('createTodo', () => {
  test('adds the todo last in its state and persists it under its own key', async () => {
    resetStore({ todos: [makeTodo({ id: 'a', order: 1 })] })
    const todo = createTodo({ title: 'Second', stateId: 'todo' })
    expect(todo.order).toBe(2)
    await flush()
    expect(fakeOrca.data.get(`todo:${todo.id}`)).toEqual(todo)
  })
})

describe('moveTodo', () => {
  test('places the todo before the target in the new state', () => {
    resetStore({
      todos: [
        makeTodo({ id: 'a', stateId: 'doing', order: 1 }),
        makeTodo({ id: 'b', stateId: 'doing', order: 2 }),
        makeTodo({ id: 'c' })
      ]
    })
    moveTodo('c', 'doing', 'b')
    expect(byId('c')).toMatchObject({ stateId: 'doing', order: 1.5 })
  })
})

describe('toggleDone', () => {
  test('moves to the first closed state and back to the first open one', () => {
    resetStore({ todos: [makeTodo({ id: 'a' })] })
    toggleDone('a')
    expect(byId('a')?.stateId).toBe('done')
    expect(byId('a')?.closedAt).toBeNumber()
    toggleDone('a')
    expect(byId('a')?.stateId).toBe('backlog')
    expect(byId('a')?.closedAt).toBeUndefined()
  })
})

describe('cyclePriority', () => {
  test('cycles none, low, medium, high, then none', () => {
    resetStore({ todos: [makeTodo({ id: 'a' })] })
    const seen = [1, 2, 3, 4].map(() => (cyclePriority('a'), byId('a')?.priority))
    expect(seen).toEqual(['low', 'med', 'high', 'none'])
  })
})

describe('deleteTodo', () => {
  test('selects the next todo and can be undone', () => {
    resetStore({ todos: [makeTodo({ id: 'a', order: 1 }), makeTodo({ id: 'b', order: 2 })] })
    selectedId.value = 'a'
    deleteTodo('a')
    expect(byId('a')).toBeUndefined()
    expect(selectedId.value).toBe('b')
    expect(lastDeleted.value?.id).toBe('a')
    undoDelete()
    expect(byId('a')).toBeDefined()
    expect(lastDeleted.value).toBeNull()
  })
})

describe('deleteState', () => {
  test('moves the todos of the deleted state to the target state', () => {
    resetStore({ todos: [makeTodo({ id: 'a', stateId: 'doing' })] })
    deleteState('doing', 'todo')
    expect(states.value.map((s) => s.id)).not.toContain('doing')
    expect(byId('a')?.stateId).toBe('todo')
  })
  test('keeps the last remaining state', () => {
    resetStore({ states: [{ id: 'only', name: 'Only', color: '#000', closed: false }] })
    deleteState('only', 'only')
    expect(states.value).toHaveLength(1)
  })
})

describe('composerTarget', () => {
  test('uses the scoped state, else the first open state', () => {
    expect(composerTarget()).toBe('backlog')
    filter.value = { ...filter.value, stateId: 'doing' }
    expect(composerTarget()).toBe('doing')
  })
})

describe('when a write fails', () => {
  test('reports a save error instead of dropping it silently', async () => {
    const quiet = spyOn(console, 'error').mockImplementation(() => {})
    fakeOrca.failNext('set')
    createTodo({ title: 'Lost', stateId: 'todo' })
    await flush()
    expect(saveError.value?.op).toBe('write')
    expect(quiet).toHaveBeenCalledTimes(1)
    quiet.mockRestore()
  })
})
