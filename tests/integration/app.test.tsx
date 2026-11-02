// The whole app rendered into happy-dom against the fake Orca frame.

import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { render } from 'preact'
import { act } from 'preact/test-utils'
import { App } from '../../src/App'
import { loadError, loaded, todos } from '../../src/store'
import { StorageError } from '../../src/errors'
import { makeTodo } from '../factories/todo'
import { resetStore } from '../factories/store'
import { fakeOrca } from '../setup'

let root: HTMLElement

const mount = () => act(() => render(<App />, root))
const text = () => root.textContent ?? ''

beforeEach(() => {
  fakeOrca.reset()
  resetStore()
  root = document.createElement('div')
  document.body.append(root)
})

afterEach(() => {
  render(null, root)
  root.remove()
})

describe('App', () => {
  test('lists todos as rows', () => {
    resetStore({ todos: [makeTodo({ id: 'a', title: 'Write tests' }), makeTodo({ id: 'b', title: 'Ship', order: 2 })] })
    mount()
    const titles = [...root.querySelectorAll('.row__title')].map((el) => el.textContent)
    expect(titles).toEqual(['Write tests', 'Ship'])
  })

  test('shows a skeleton until storage has loaded', () => {
    loaded.value = false
    mount()
    expect(root.querySelector('.skeleton')).not.toBeNull()
  })

  test('teaches the first step when there are no todos', () => {
    mount()
    expect(text()).toContain('No to-dos yet')
  })

  test('N opens the composer and submitting it adds the todo', async () => {
    mount()
    await act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }))
    })
    const input = root.querySelector<HTMLInputElement>('.composer__input')
    expect(input).not.toBeNull()
    await act(() => {
      input!.value = 'From the composer'
      input!.dispatchEvent(new Event('input', { bubbles: true }))
      input!.form!.requestSubmit()
    })
    expect(todos.value.map((t) => t.title)).toContain('From the composer')
  })

  test('a load failure offers a retry instead of an empty list', async () => {
    loadError.value = new StorageError('load', undefined)
    mount()
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Could not load your to-dos')

    const error = spyOn(console, 'error').mockImplementation(() => {})
    const retry = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Try again')
    await act(async () => {
      retry!.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(root.querySelector('[role="alert"]')).toBeNull()
    error.mockRestore()
  })
})
