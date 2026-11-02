// Global keyboard layer. Single keys act only when focus is not in a text field; fields handle their
// own Escape and Enter and stop propagation, so Esc backs out one layer at a time.

import { focusRequest, searchRef } from './focus'
import {
  composer,
  cyclePriority,
  deleteTodo,
  detailOpen,
  filter,
  groups,
  lastDeleted,
  menuOpen,
  navOrder,
  openComposer,
  scope,
  scopeKey,
  scopes,
  select,
  selected,
  selectedId,
  setScope,
  sheet,
  shiftState,
  states,
  toggleDone,
  undoDelete,
  updateTodo,
  moveTodo,
  view
} from './store'

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

function reveal(id: string | null) {
  if (!id) return
  requestAnimationFrame(() =>
    document.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  )
}

function step(delta: 1 | -1) {
  const order = navOrder.value
  if (!order.length) return
  const i = order.findIndex((t) => t.id === selectedId.value)
  const next =
    i < 0 ? (delta > 0 ? order[0] : order.at(-1)!) : order[Math.min(order.length - 1, Math.max(0, i + delta))]
  select(next.id)
  reveal(next.id)
}

/** Board: jump to the same row in the next non-empty column. */
function stepColumn(delta: 1 | -1) {
  const cols = groups.value.filter((g) => g.items.length)
  if (!cols.length) return
  const at = cols.findIndex((g) => g.items.some((t) => t.id === selectedId.value))
  if (at < 0) return step(1)
  const row = cols[at].items.findIndex((t) => t.id === selectedId.value)
  const col = cols[at + delta]
  if (!col) return
  const next = col.items[Math.min(row, col.items.length - 1)]
  select(next.id)
  reveal(next.id)
}

function stepScope(delta: 1 | -1) {
  const list = scopes.value
  const i = list.findIndex((s) => scopeKey(s) === scopeKey(scope.value))
  const next = list[(i + delta + list.length) % list.length]
  if (next) setScope(next)
}

function escape(): boolean {
  if (sheet.value) sheet.value = null
  else if (menuOpen.value) menuOpen.value = false
  else if (composer.value) composer.value = null
  else if (detailOpen.value) detailOpen.value = false
  else if (selectedId.value) selectedId.value = null
  else if (filter.value.text) filter.value = { ...filter.value, text: '' }
  else return false
  return true
}

export function onKeyDown(e: KeyboardEvent): void {
  if (e.defaultPrevented || e.isComposing) return
  const mod = e.metaKey || e.ctrlKey

  if (e.key === 'Escape') {
    if (isTyping(e.target)) (e.target as HTMLElement).blur()
    else if (escape()) e.preventDefault()
    return
  }
  if (isTyping(e.target)) return

  if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey && lastDeleted.value) {
    e.preventDefault()
    undoDelete()
    return
  }
  if (mod || e.altKey || sheet.value) return

  const todo = selected.value
  const key = e.key
  const handled = (() => {
    switch (key) {
      case 'j':
      case 'ArrowDown':
        return (step(1), true)
      case 'k':
      case 'ArrowUp':
        return (step(-1), true)
      case 'h':
      case 'ArrowLeft':
        return view.value === 'board' && (stepColumn(-1), true)
      case 'l':
      case 'ArrowRight':
        return view.value === 'board' && (stepColumn(1), true)
      case 'H':
        return todo && (shiftState(todo.id, -1), true)
      case 'L':
        return todo && (shiftState(todo.id, 1), true)
      case '[':
        return (stepScope(-1), true)
      case ']':
        return (stepScope(1), true)
      case 'n':
      case 'c':
        return (openComposer(), true)
      case '/':
        return (searchRef.current?.focus(), true)
      case 'v':
        return ((view.value = view.value === 'list' ? 'board' : 'list'), true)
      case '?':
        return ((sheet.value = 'shortcuts'), true)
      case 'Enter':
        if (!todo) return false
        if (detailOpen.value) focusRequest.field = 'title'
        select(todo.id, true)
        // Re-render may not happen when already open; focus directly.
        requestAnimationFrame(() => {
          if (focusRequest.field !== 'title') return
          focusRequest.field = null
          const el = document.querySelector<HTMLTextAreaElement>('.detail__title')
          el?.focus()
          el?.select()
        })
        return true
      case 'e':
        if (!todo) return false
        focusRequest.field = 'description'
        select(todo.id, true)
        requestAnimationFrame(() =>
          document.querySelector<HTMLButtonElement>('.description__empty, .description__edit')?.click()
        )
        return true
      case 'x':
        return todo && (toggleDone(todo.id), true)
      case 'p':
        return todo && (cyclePriority(todo.id), true)
      case 'a':
        return todo && (updateTodo(todo.id, { archived: !todo.archived }), true)
      case 'Backspace':
      case 'Delete':
        return todo && (deleteTodo(todo.id), true)
    }
    if (/^[1-9]$/.test(key) && todo) {
      const state = states.value[Number(key) - 1]
      if (state) moveTodo(todo.id, state.id)
      return true
    }
    return false
  })()
  if (handled) e.preventDefault()
}
