// The whole app rendered into happy-dom against the fake Orca frame.

import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { render } from 'preact'
import { act } from 'preact/test-utils'
import { App } from '../../src/App'
import { loadError, loaded, selectedId, todos } from '../../src/store'
import { StorageError } from '../../src/errors'
import { makeTodo } from '../factories/todo'
import { resetStore } from '../factories/store'
import { serveWorker } from '../factories/workspaces'
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

  describe('copy as agent prompt', () => {
    // happy-dom has no clipboard: stand in for execCommand, which spyOn cannot wrap there.
    const original = document.execCommand
    const stubCopy = (fn: () => boolean) => {
      const calls: string[] = []
      document.execCommand = (command: string) => (calls.push(command), fn())
      return calls
    }
    afterEach(() => {
      document.execCommand = original
    })
    const pressY = () =>
      act(() => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', bubbles: true, cancelable: true }))
      })

    test('Y copies the selected to-do as a prompt and says so', async () => {
      resetStore({ todos: [makeTodo({ id: 'a', title: 'Fix login', description: 'Steps' })] })
      selectedId.value = 'a'
      let copied = ''
      const calls = stubCopy(() => {
        copied = document.querySelector<HTMLTextAreaElement>('textarea[readonly]')?.value ?? ''
        return true
      })
      mount()
      await pressY()
      expect(calls).toEqual(['copy'])
      expect(copied).toBe('# Fix login\n\nSteps')
      expect(root.querySelector('[role="status"]')?.textContent).toContain('Copied as an agent prompt')
    })

    test('says so when the clipboard refuses', async () => {
      resetStore({ todos: [makeTodo({ id: 'a' })] })
      selectedId.value = 'a'
      stubCopy(() => false)
      const warn = spyOn(console, 'warn').mockImplementation(() => {})
      mount()
      await pressY()
      expect(root.querySelector('[role="alert"]')?.textContent).toContain('Could not copy')
      warn.mockRestore()
    })
  })

  describe('send to agent', () => {
    const press = (key: string) =>
      act(() => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
      })
    const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)))

    test('S opens the sheet with the prompt and the focused workspace, and Send starts the agent', async () => {
      resetStore({ todos: [makeTodo({ id: 'a', title: 'Fix login', description: 'Steps' })] })
      selectedId.value = 'a'
      serveWorker(fakeOrca)
      mount()
      await press('s')
      await settle()
      const sheet = root.querySelector('[role="dialog"][aria-label="Send to agent"]')!
      expect(sheet.querySelector('textarea')?.value).toBe('# Fix login\n\nSteps')
      expect(sheet.querySelector<HTMLSelectElement>('#agent-workspace')?.value).toBe('w2')
      await act(() => sheet.querySelector<HTMLButtonElement>('button[type="submit"]')!.click())
      await settle()
      expect(fakeOrca.requests.at(-1)?.name).toBe('agent.launch')
      expect(root.querySelector('[aria-label="Send to agent"]')).toBeNull()
      expect(todos.value[0].stateId).toBe('doing')
      expect(root.querySelector('[role="status"]')?.textContent).toContain('Started Claude')
    })
  })
})
