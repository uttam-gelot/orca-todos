// The store against the fake Orca frame: load, persist, follow writes from the other surface.

import { beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { DEFAULT_STATES } from '../../src/model'
import { createTodo, load, loaded, loadError, states, todos, updateTodo } from '../../src/store'
import { CUSTOM_STATES, INVALID_TODOS, LEGACY_TODO, VALID_TODO } from '../fixtures/stored-records'
import { resetStore } from '../factories/store'
import { fakeOrca } from '../setup'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  fakeOrca.reset()
  resetStore()
  loaded.value = false
})

describe('load', () => {
  test('reads stored todos and states and skips records that are not valid', async () => {
    fakeOrca.data.set('states', CUSTOM_STATES)
    fakeOrca.data.set('todo:v1', VALID_TODO)
    fakeOrca.data.set('todo:old', LEGACY_TODO)
    INVALID_TODOS.forEach((value, i) => fakeOrca.data.set(`todo:bad${i}`, value))
    const warn = spyOn(console, 'warn').mockImplementation(() => {})

    await load()

    expect(loaded.value).toBe(true)
    expect(states.value).toEqual(CUSTOM_STATES)
    expect(todos.value.map((t) => t.id).sort()).toEqual(['old', 'v1'])
    warn.mockRestore()
  })

  test('seeds the default states on first run', async () => {
    await load()
    await flush()
    expect(states.value).toEqual(DEFAULT_STATES)
    expect(fakeOrca.data.get('states')).toEqual(DEFAULT_STATES)
  })

  test('reports a failure and loads on retry', async () => {
    const error = spyOn(console, 'error').mockImplementation(() => {})
    fakeOrca.data.set('todo:v1', VALID_TODO)
    fakeOrca.failNext('keys')

    await load()
    expect(loaded.value).toBe(false)
    expect(loadError.value?.op).toBe('load')

    await load()
    expect(loadError.value).toBeNull()
    expect(todos.value.map((t) => t.id)).toEqual(['v1'])
    error.mockRestore()
  })
})

describe('after load', () => {
  beforeEach(async () => {
    await load()
    await flush()
  })

  test('changes persist to storage', async () => {
    const todo = createTodo({ title: 'Ship it', stateId: 'todo' })
    updateTodo(todo.id, { title: 'Ship it today' })
    await flush()
    expect(fakeOrca.data.get(`todo:${todo.id}`)).toMatchObject({ title: 'Ship it today' })
  })

  test('a write from the other surface shows up here', async () => {
    fakeOrca.writeFromElsewhere('todo:v1', VALID_TODO)
    await flush()
    expect(todos.value.find((t) => t.id === 'v1')?.title).toBe('Valid')

    fakeOrca.writeFromElsewhere('states', CUSTOM_STATES)
    await flush()
    expect(states.value).toEqual(CUSTOM_STATES)
  })

  test('a delete from the other surface removes the todo here', async () => {
    fakeOrca.writeFromElsewhere('todo:v1', VALID_TODO)
    await flush()
    await fakeOrca.storage.delete('todo:v1')
    await flush()
    expect(todos.value.find((t) => t.id === 'v1')).toBeUndefined()
  })
})
