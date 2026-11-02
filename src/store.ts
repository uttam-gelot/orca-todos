// App state as signals, persisted in Orca's plugin storage. Each todo is its own key (`todo:<id>`)
// because a stored value is capped at 256 KiB; `states` holds the ordered state list.
// Storage is shared by the sidebar panel and the center tab, and `onDidChange` keeps both in sync.

import { computed, effect, signal } from '@preact/signals'
import { StorageError } from './errors'
import { log } from './log'
import { storage } from './orca'
import {
  DEFAULT_STATES,
  EMPTY_FILTER,
  matches,
  orderBefore,
  parseStates,
  parseTodo,
  patchTodo,
  PRIORITIES,
  sortTodos,
  stats,
  uid,
  type Filter,
  type Sort,
  type State,
  type Todo
} from './model'

const TODO_KEY = 'todo:'
const STATES_KEY = 'states'

/** `board` is the center editor tab, `panel` the right sidebar. */
export const mode = (document.body.dataset.mode ?? 'panel') as 'panel' | 'board'
export const loaded = signal(false)
export const states = signal<State[]>([])
export const todos = signal<Todo[]>([])

// --- per-surface view preferences (sidebar and center tab remember their own) ---

type View = 'list' | 'board'
type Prefs = { view: View; sort: Sort; filter: Filter; collapsed: string[] }
const PREFS_KEY = `orca-todos:prefs:${mode}`
const VIEWS: View[] = ['list', 'board']
const SORTS: Sort[] = ['manual', 'priority', 'updated', 'created']

// Prefs are a convenience: on any problem the surface opens with defaults, and the reason is logged.
function loadPrefs(): Prefs {
  const fallback: Prefs = { view: 'list', sort: 'manual', filter: EMPTY_FILTER, collapsed: [] }
  let saved: Partial<Prefs>
  try {
    saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>
  } catch (error) {
    log.warn('Ignoring unreadable view preferences', { op: 'loadPrefs', mode }, error)
    return fallback
  }
  return {
    view: VIEWS.includes(saved.view as View) ? (saved.view as View) : fallback.view,
    sort: SORTS.includes(saved.sort as Sort) ? (saved.sort as Sort) : fallback.sort,
    filter: { ...EMPTY_FILTER, ...saved.filter, text: '' },
    collapsed: Array.isArray(saved.collapsed) ? saved.collapsed.filter((id) => typeof id === 'string') : []
  }
}

const prefs = loadPrefs()
export const view = signal<View>(prefs.view)
export const sort = signal<Sort>(prefs.sort)
export const filter = signal<Filter>(prefs.filter)
export const collapsed = signal(new Set(prefs.collapsed))

effect(() => {
  const next: Prefs = { view: view.value, sort: sort.value, filter: filter.value, collapsed: [...collapsed.value] }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  } catch (error) {
    log.warn('Could not save view preferences', { op: 'savePrefs', mode }, error)
  }
})

export function toggleCollapsed(id: string): void {
  const next = new Set(collapsed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsed.value = next
}

// --- UI state ---

export const selectedId = signal<string | null>(null)
/** Whether the detail pane (or, when narrow, the detail sheet) is showing the selected todo. */
export const detailOpen = signal(false)
/** The state whose inline composer is open, or null. */
export const composer = signal<string | null>(null)
export const sheet = signal<null | 'states' | 'shortcuts'>(null)
export const menuOpen = signal(false)

const WIDE = '(min-width: 1040px)'
export const wide = signal(matchMedia(WIDE).matches)
matchMedia(WIDE).addEventListener('change', (e) => (wide.value = e.matches))

// --- scope: what the navigator rail selects (all, one state, one tag, or archived) ---

export type Scope = { kind: 'all' } | { kind: 'state'; id: string } | { kind: 'tag'; id: string } | { kind: 'archived' }

export const scope = computed<Scope>(() => {
  const f = filter.value
  if (f.archived) return { kind: 'archived' }
  if (f.stateId) return { kind: 'state', id: f.stateId }
  if (f.tags[0]) return { kind: 'tag', id: f.tags[0] }
  return { kind: 'all' }
})

export const scopeKey = (s: Scope): string => ('id' in s ? `${s.kind}:${s.id}` : s.kind)

export function setScope(s: Scope): void {
  const f = filter.value
  filter.value = {
    ...f,
    archived: s.kind === 'archived',
    stateId: s.kind === 'state' ? s.id : '',
    tags: s.kind === 'tag' ? [s.id] : []
  }
  composer.value = null
}

// --- derived ---

const live = computed(() => todos.value.filter((t) => !t.archived))
export const stateById = computed(() => new Map(states.value.map((s) => [s.id, s])))
export const visible = computed(() =>
  sortTodos(
    todos.value.filter((t) => matches(t, filter.value)),
    sort.value
  )
)
export const summary = computed(() => stats(todos.value, states.value))

export const tagCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const t of live.value) for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts].sort(([a], [b]) => a.localeCompare(b))
})
export const archivedCount = computed(() => todos.value.length - live.value.length)

/** Every scope in rail order, for `[` and `]`. */
export const scopes = computed<Scope[]>(() => [
  { kind: 'all' },
  ...states.value.map((s) => ({ kind: 'state' as const, id: s.id })),
  ...tagCounts.value.map(([id]) => ({ kind: 'tag' as const, id })),
  { kind: 'archived' }
])

/** Todos grouped by state, in state order. Empty groups hide while searching or filtering. */
export const groups = computed(() => {
  const f = filter.value
  const narrowed = Boolean(f.text.trim() || f.priority || f.archived)
  return states.value
    .filter((s) => !f.stateId || s.id === f.stateId)
    .map((state) => ({ state, items: visible.value.filter((t) => t.stateId === state.id) }))
    .filter((g) => !narrowed || g.items.length > 0)
})

/** The todos in on-screen order, for j/k. */
export const navOrder = computed(() =>
  groups.value.flatMap((g) => (view.value === 'list' && collapsed.value.has(g.state.id) ? [] : g.items))
)

export const selected = computed(() => todos.value.find((t) => t.id === selectedId.value) ?? null)

export function select(id: string | null, open = detailOpen.value): void {
  selectedId.value = id
  detailOpen.value = id !== null && open
}

/** Where `n` adds a todo: the scoped state, else the selected todo's state, else the first open one. */
export function composerTarget(): string {
  const f = filter.value
  const open = states.value.find((s) => !s.closed) ?? states.value[0]
  return f.stateId || (view.value === 'board' ? selected.value?.stateId : undefined) || open?.id || ''
}

export function openComposer(stateId = composerTarget()): void {
  if (filter.value.archived) setScope({ kind: 'all' })
  if (collapsed.value.has(stateId)) toggleCollapsed(stateId)
  composer.value = stateId
}

// --- load and sync ---

/** Set when the initial load fails; the app shows it with a retry instead of an endless skeleton. */
export const loadError = signal<StorageError | null>(null)
/** Set when a write did not reach storage, so the user knows the change may not be kept. */
export const saveError = signal<StorageError | null>(null)

/** Runs a storage write in the background and reports a failure instead of dropping it. */
function persist(op: 'write' | 'delete', key: string, write: Promise<void>): void {
  write.catch((cause: unknown) => {
    const error = new StorageError(op, key, { cause })
    log.error('Could not save a change', { op, key }, error)
    saveError.value = error
  })
}

async function readTodo(key: string): Promise<Todo | null> {
  const value = await storage.get(key)
  const todo = parseTodo(value)
  if (value !== null && !todo) log.warn('Skipping a stored to-do that is not valid', { op: 'read', key })
  return todo
}

async function readStates(): Promise<State[] | null> {
  const value = await storage.get(STATES_KEY)
  const list = parseStates(value)
  if (value !== null && !list)
    log.warn('Stored states are not valid; using the defaults', { op: 'read', key: STATES_KEY })
  return list
}

// Another surface (or this one) wrote a key: re-read just that key.
async function onStorageChange(key: string): Promise<void> {
  try {
    if (key === STATES_KEY) states.value = (await readStates()) ?? DEFAULT_STATES
    if (!key.startsWith(TODO_KEY)) return
    const id = key.slice(TODO_KEY.length)
    const todo = await readTodo(key)
    const rest = todos.value.filter((t) => t.id !== id)
    todos.value = todo ? [...rest, todo] : rest
  } catch (cause) {
    log.error('Could not apply a change from storage', { op: 'read', key }, new StorageError('read', key, { cause }))
  }
}

let subscription: { dispose(): void } | null = null

/** Reads every todo and the state list, then follows changes. Safe to call again to retry. */
export async function load(): Promise<void> {
  loadError.value = null
  try {
    const keys = await storage.keys()
    const saved = await readStates()
    if (!saved) persist('write', STATES_KEY, storage.set(STATES_KEY, DEFAULT_STATES))
    const list = await Promise.all(keys.filter((k) => k.startsWith(TODO_KEY)).map(readTodo))
    states.value = saved ?? DEFAULT_STATES
    todos.value = list.filter((t): t is Todo => t !== null)
  } catch (cause) {
    const error = new StorageError('load', undefined, { cause })
    log.error('Could not load to-dos', { op: 'load' }, error)
    loadError.value = error
    return
  }
  loaded.value = true
  subscription?.dispose()
  subscription = storage.onDidChange(({ key }) => void onStorageChange(key))
  log.info('Loaded to-dos', { mode, todos: todos.value.length, states: states.value.length })
}

// --- todo actions ---

function put(todo: Todo): void {
  todos.value = [...todos.value.filter((t) => t.id !== todo.id), todo]
  persist('write', TODO_KEY + todo.id, storage.set(TODO_KEY + todo.id, todo))
}

export function createTodo(input: Pick<Todo, 'title' | 'stateId'> & Partial<Todo>): Todo {
  const now = Date.now()
  const todo = patchTodo(
    {
      description: '',
      tags: [],
      priority: 'none',
      ...input,
      id: uid(),
      archived: false,
      order: orderBefore(todos.value, input.stateId, null),
      createdAt: now,
      updatedAt: now
    },
    {},
    states.value,
    now
  )
  put(todo)
  return todo
}

export function updateTodo(id: string, patch: Partial<Todo>): void {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) put(patchTodo(todo, patch, states.value))
}

/** Moves a todo to a state, before `beforeId` there (or last). */
export function moveTodo(id: string, stateId: string, beforeId: string | null = null): void {
  if (id === beforeId) return
  const others = todos.value.filter((t) => t.id !== id)
  updateTodo(id, { stateId, order: orderBefore(others, stateId, beforeId) })
}

/** Moves a todo one state left or right. */
export function shiftState(id: string, delta: -1 | 1): void {
  const todo = todos.value.find((t) => t.id === id)
  const i = states.value.findIndex((s) => s.id === todo?.stateId)
  const next = states.value[i + delta]
  if (todo && next) moveTodo(id, next.id)
}

/** Done ↔ open: to the first closed state, or back to the first open one. */
export function toggleDone(id: string): void {
  const todo = todos.value.find((t) => t.id === id)
  if (!todo) return
  const isClosed = stateById.value.get(todo.stateId)?.closed
  const target = states.value.find((s) => s.closed !== isClosed)
  if (target) moveTodo(id, target.id)
}

export function cyclePriority(id: string): void {
  const todo = todos.value.find((t) => t.id === id)
  if (!todo) return
  // none → low → med → high → none
  const order = [...PRIORITIES].reverse()
  updateTodo(id, { priority: order[(order.indexOf(todo.priority) + 1) % order.length] })
}

export const lastDeleted = signal<Todo | null>(null)

/** Deletes a todo and moves the selection to its neighbour. */
export function deleteTodo(id: string): void {
  const order = navOrder.value
  const i = order.findIndex((t) => t.id === id)
  if (selectedId.value === id) selectedId.value = (order[i + 1] ?? order[i - 1])?.id ?? null
  if (!selectedId.value) detailOpen.value = false
  lastDeleted.value = todos.value.find((t) => t.id === id) ?? null
  todos.value = todos.value.filter((t) => t.id !== id)
  persist('delete', TODO_KEY + id, storage.delete(TODO_KEY + id))
}

export function undoDelete(): void {
  const todo = lastDeleted.value
  if (!todo) return
  put(todo)
  lastDeleted.value = null
  select(todo.id)
}

export function archiveClosed(): number {
  const closed = new Set(states.value.filter((s) => s.closed).map((s) => s.id))
  const list = live.value.filter((t) => closed.has(t.stateId))
  for (const t of list) updateTodo(t.id, { archived: true })
  return list.length
}

// --- state actions ---

function saveStates(next: State[]): void {
  states.value = next
  persist('write', STATES_KEY, storage.set(STATES_KEY, next))
}

const STATE_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#84cc16']

export function addState(name: string): void {
  const color = STATE_COLORS[states.value.length % STATE_COLORS.length]
  saveStates([...states.value, { id: uid(), name, color, closed: false }])
}

export function updateState(id: string, patch: Partial<State>): void {
  saveStates(states.value.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  // Re-derive closedAt for todos in this state when its `closed` flag flips.
  if ('closed' in patch) for (const t of todos.value) if (t.stateId === id) updateTodo(t.id, {})
}

export function moveState(id: string, delta: -1 | 1): void {
  const list = [...states.value]
  const i = list.findIndex((s) => s.id === id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  saveStates(list)
}

/** Deletes a state, moving its todos to `targetId`. The last state cannot be deleted. */
export function deleteState(id: string, targetId: string): void {
  if (states.value.length <= 1 || id === targetId) return
  for (const t of todos.value) if (t.stateId === id) moveTodo(t.id, targetId)
  if (filter.value.stateId === id) setScope({ kind: 'all' })
  saveStates(states.value.filter((s) => s.id !== id))
}
