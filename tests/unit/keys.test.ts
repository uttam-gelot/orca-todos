import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { onKeyDown } from '../../src/keys'
import { composer, detailOpen, selectedId, todos, view } from '../../src/store'
import { makeTodo } from '../factories/todo'
import { resetStore } from '../factories/store'

/** Dispatches a keydown on `target` and says whether the plugin claimed it. */
function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): boolean {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event.defaultPrevented
}

beforeAll(() => document.addEventListener('keydown', onKeyDown))
afterAll(() => document.removeEventListener('keydown', onKeyDown))
beforeEach(() => resetStore({ todos: [makeTodo({ id: 'a', order: 1 }), makeTodo({ id: 'b', order: 2 })] }))

describe('navigation', () => {
  test('j and k move the selection through the list', () => {
    expect(press('j')).toBe(true)
    expect(selectedId.value).toBe('a')
    press('j')
    expect(selectedId.value).toBe('b')
    press('k')
    expect(selectedId.value).toBe('a')
  })
  test('Escape backs out one layer at a time', () => {
    selectedId.value = 'a'
    detailOpen.value = true
    press('Escape')
    expect([detailOpen.value, selectedId.value]).toEqual([false, 'a'])
    press('Escape')
    expect(selectedId.value).toBeNull()
  })
})

describe('actions on the selected todo', () => {
  test('x marks it done and a number moves it to that state', () => {
    selectedId.value = 'a'
    press('x')
    expect(todos.value.find((t) => t.id === 'a')?.stateId).toBe('done')
    press('3')
    expect(todos.value.find((t) => t.id === 'a')?.stateId).toBe('doing')
  })
  test('n opens the composer and v switches the view', () => {
    press('n')
    expect(composer.value).toBe('backlog')
    press('v')
    expect(view.value).toBe('board')
  })
})

describe('keys the plugin must leave alone', () => {
  test('single keys typed into a field do nothing', () => {
    const input = document.createElement('input')
    document.body.append(input)
    selectedId.value = 'a'
    expect(press('x', {}, input)).toBe(false)
    expect(todos.value.find((t) => t.id === 'a')?.stateId).toBe('todo')
    input.remove()
  })
  test('Orca shortcuts (Cmd/Ctrl chords) pass through untouched', () => {
    selectedId.value = 'a'
    for (const key of ['p', 't', 'w', 'j', '1']) {
      expect(press(key, { metaKey: true })).toBe(false)
      expect(press(key, { ctrlKey: true })).toBe(false)
    }
    expect(selectedId.value).toBe('a')
  })
})
