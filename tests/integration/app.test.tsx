// The whole app rendered into happy-dom against the fake Orca frame.

import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { render } from 'preact'
import { act } from 'preact/test-utils'
import { App } from '../../src/App'
import { filter, loadError, loaded, selectedId, sort, todos } from '../../src/store'
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

  describe('header', () => {
    test('counts open high-priority to-dos and filters by them', async () => {
      resetStore({
        todos: [
          makeTodo({ id: 'a', title: 'A', priority: 'high' }),
          makeTodo({ id: 'b', title: 'B', priority: 'high', stateId: 'done' }),
          makeTodo({ id: 'c', title: 'C', priority: 'low' })
        ]
      })
      mount()
      const chip = () => root.querySelector<HTMLButtonElement>('.header__high')
      expect(chip()?.textContent).toBe('1high')
      await act(() => chip()!.click())
      expect(chip()?.getAttribute('aria-pressed')).toBe('true')
      expect(root.querySelectorAll('.row').length).toBe(2)
      await act(() => chip()!.click())
      expect(root.querySelectorAll('.row').length).toBe(3)
    })

    test('hides the count when nothing open is high priority', () => {
      resetStore({ todos: [makeTodo({ id: 'a', priority: 'med' })] })
      mount()
      expect(root.querySelector('.header__high')).toBeNull()
    })

    test('the display menu resets a changed priority and order', async () => {
      resetStore({ todos: [makeTodo({ id: 'a' })] })
      filter.value = { ...filter.value, priority: 'low' }
      sort.value = 'priority'
      mount()
      const menu = root.querySelector<HTMLButtonElement>('[aria-haspopup]')!
      expect(menu.getAttribute('aria-label')).toBe('Display options (filter or order on)')
      await act(() => menu.click())
      const reset = [...root.querySelectorAll<HTMLButtonElement>('.menu__item')].find((b) =>
        b.textContent?.includes('Reset')
      )!
      await act(() => reset.click())
      expect(filter.value.priority).toBe('')
      expect(sort.value).toBe('manual')
    })
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

    const dialog = () => root.querySelector('[role="dialog"][aria-label="Start agent"]')

    test('S opens the dialog on the focused workspace showing the prompt, and Start starts the agent', async () => {
      resetStore({ todos: [makeTodo({ id: 'a', title: 'Fix login', description: 'Steps' })] })
      selectedId.value = 'a'
      serveWorker(fakeOrca)
      mount()
      await press('s')
      await settle()
      const form = dialog()!
      expect(form.querySelector<HTMLSelectElement>('#agent-workspace')?.value).toBe('w2')
      expect(form.querySelector('textarea')).toBeNull()
      expect(form.querySelector('pre#agent-prompt')?.textContent).toBe('# Fix login\n\nSteps')
      await act(() => form.querySelector<HTMLButtonElement>('.agent-dialog__edit')!.click())
      expect(form.querySelector('textarea')?.value).toBe('# Fix login\n\nSteps')
      await act(() => form.querySelector<HTMLButtonElement>('button[type="submit"]')!.click())
      await settle()
      expect(fakeOrca.requests.at(-1)?.name).toBe('agent.launch')
      expect(dialog()).toBeNull()
      expect(todos.value[0].stateId).toBe('doing')
      expect(root.querySelector('[role="status"]')?.textContent).toContain('Started Claude')
    })

    test('keeps an edited prompt when the dialog closes before starting', async () => {
      resetStore({ todos: [makeTodo({ id: 'b', title: 'Fix login' })] })
      selectedId.value = 'b'
      serveWorker(fakeOrca)
      mount()
      await press('s')
      await settle()
      await act(() => dialog()!.querySelector<HTMLButtonElement>('.agent-dialog__edit')!.click())
      const area = dialog()!.querySelector('textarea')!
      area.value = 'Only the login form'
      await act(() => void area.dispatchEvent(new Event('input', { bubbles: true })))
      await press('Escape')
      expect(dialog()).toBeNull()
      await press('s')
      await settle()
      expect(dialog()!.querySelector('textarea')?.value).toBe('Only the login form')
    })

    test('a row turns its agent button into Open once an agent runs, and Open shows its workspace', async () => {
      resetStore({ todos: [makeTodo({ id: 'a', title: 'Fix login' })] })
      serveWorker(fakeOrca)
      mount()
      const button = () => root.querySelector<HTMLButtonElement>('#todo-a .agent-button')!
      expect(button().textContent).toBe('Agent')
      await act(() => button().click())
      await settle()
      expect(dialog()).not.toBeNull()
      await act(() => dialog()!.querySelector<HTMLButtonElement>('button[type="submit"]')!.click())
      await settle()
      expect(button().textContent).toBe('Open')
      expect(root.querySelector('#todo-a .run-badge__label')?.textContent).toBe('Starting')
      await act(() => button().click())
      await settle()
      expect(fakeOrca.requests.at(-1)).toEqual({ name: 'workspace.open', input: { workspaceId: 'w2' } })
    })
  })
})
