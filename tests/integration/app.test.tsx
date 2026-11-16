// The whole app rendered into happy-dom against the fake Orca frame.

import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { render } from 'preact'
import { act } from 'preact/test-utils'
import { App } from '../../src/App'
import { detailOpen, filter, loadError, loaded, navOrder, selectedId, sort, todos, view } from '../../src/store'
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

  test('the composer reads tags and a priority from the title', async () => {
    mount()
    await act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }))
    })
    const input = root.querySelector<HTMLInputElement>('.composer__input')!
    await act(() => {
      input.value = 'Fix login #auth !high'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.form!.requestSubmit()
    })
    const added = todos.value.find((t) => t.title === 'Fix login')
    expect(added?.tags).toEqual(['auth'])
    expect(added?.priority).toBe('high')
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
      expect(sort.peek() as string).toBe('manual')
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

describe('checklist', () => {
  const notes = 'Steps\n- [x] Write it\n- [ ] Test it\n- [ ] Ship it'

  test('rows show the progress of the checklist in the notes', async () => {
    resetStore({ todos: [makeTodo({ id: 'a', description: notes })] })
    await mount()
    expect(root.querySelector('.row .checklist')?.textContent).toContain('1/3')
    expect(root.querySelector('.row .checklist .sr-only')?.textContent).toBe('Checklist: 1 of 3 done')
  })

  test('ticking an item in the details pane saves it in the notes', async () => {
    resetStore({ todos: [makeTodo({ id: 'a', description: notes })] })
    selectedId.value = 'a'
    detailOpen.value = true
    await mount()
    const boxes = root.querySelectorAll<HTMLInputElement>('.description .md input[type="checkbox"]')
    expect([...boxes].map((b) => b.getAttribute('aria-label'))).toEqual(['Write it', 'Test it', 'Ship it'])
    expect(boxes[1].disabled).toBe(false)
    await act(() => boxes[1].click())
    expect(todos.value[0].description).toBe(notes.replace('- [ ] Test it', '- [x] Test it'))
  })
})

describe('add slot', () => {
  test('open groups end with an Add to-do row that opens the composer; closed ones do not', async () => {
    resetStore({ todos: [makeTodo({ id: 'a', stateId: 'todo' })] })
    await mount()
    const slots = [...root.querySelectorAll<HTMLButtonElement>('.add-slot')]
    const groupOf = (el: Element) => el.closest('.group')?.getAttribute('aria-label')
    expect(slots.map(groupOf)).toEqual(['Backlog', 'ToDo', 'In Progress'])
    await act(() => slots[1].click())
    expect(root.querySelector('.group[aria-label="ToDo"] .composer__input')).not.toBeNull()
    expect(root.querySelector('.group[aria-label="ToDo"] .add-slot')).toBeNull()
  })
})

describe('search', () => {
  test('folds into the header icon while empty, and / unfolds and focuses it', async () => {
    await mount()
    expect(root.querySelector('.search')?.classList.contains('search--folded')).toBe(true)
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }))
      await new Promise((r) => requestAnimationFrame(r))
    })
    const input = root.querySelector<HTMLInputElement>('.search__input')!
    expect(root.querySelector('.search')?.classList.contains('search--folded')).toBe(false)
    expect(document.activeElement).toBe(input)
    await act(() => input.blur())
    expect(root.querySelector('.search')?.classList.contains('search--folded')).toBe(true)
  })
})

describe('board columns', () => {
  test('collapse to a strip that j/k skip, and expand again', async () => {
    resetStore({ todos: [makeTodo({ id: 'a', stateId: 'todo' }), makeTodo({ id: 'b', stateId: 'backlog' })] })
    view.value = 'board'
    await mount()
    await act(() => root.querySelector<HTMLButtonElement>('.column[aria-label="ToDo"] .column__collapse')!.click())
    const strip = root.querySelector<HTMLButtonElement>('.column[aria-label="ToDo"] .column__strip')!
    expect(strip.textContent).toContain('1')
    expect(root.querySelector('.card[data-id="a"]')).toBeNull()
    expect(navOrder.value.map((t) => t.id)).toEqual(['b'])
    await act(() => strip.click())
    expect(root.querySelector('.card[data-id="a"]')).not.toBeNull()
  })
})

describe('unseen runs', () => {
  test('a finished run stands out until its to-do is selected', async () => {
    const run = {
      terminalId: 't1',
      agent: 'claude',
      workspaceId: 'w1',
      workspaceName: 'app',
      startedAt: 1,
      state: 'done' as const,
      stateAt: 2
    }
    resetStore({ todos: [makeTodo({ id: 'a', runs: [run] }), makeTodo({ id: 'b', order: 2 })] })
    await mount()
    const badge = () => root.querySelector('.row[data-id="a"] .run-badge')
    expect(badge()?.classList.contains('run-badge--unseen')).toBe(true)
    await act(() => root.querySelector<HTMLElement>('.row[data-id="a"]')!.click())
    expect(badge()?.classList.contains('run-badge--unseen')).toBe(false)
    await act(() => root.querySelector<HTMLElement>('.row[data-id="b"]')!.click())
    expect(badge()?.classList.contains('run-badge--unseen')).toBe(false)
  })
})

describe('notes editor', () => {
  test('Enter continues a checklist', async () => {
    resetStore({ todos: [makeTodo({ id: 'a', description: '- [x] one' })] })
    selectedId.value = 'a'
    detailOpen.value = true
    await mount()
    await act(() => root.querySelector<HTMLButtonElement>('.description__edit')!.click())
    const area = root.querySelector<HTMLTextAreaElement>('.description__input')!
    area.setSelectionRange(9, 9)
    await act(
      () => void area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    )
    expect(area.value).toBe('- [x] one\n- [ ] ')
    expect(area.selectionStart).toBe(16)
  })
})
