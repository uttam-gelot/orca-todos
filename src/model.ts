// Pure data logic: no Orca, no DOM, so it is unit-tested directly.

export type Priority = 'none' | 'low' | 'med' | 'high'
export type State = { id: string; name: string; color: string; closed: boolean }
export type Todo = {
  id: string
  title: string
  description: string
  stateId: string
  tags: string[]
  priority: Priority
  archived: boolean
  order: number
  createdAt: number
  updatedAt: number
  closedAt?: number
  /** Agents this to-do was sent to, oldest first. */
  runs: AgentRun[]
}

/** What an agent is doing, as Orca reports it. `starting` until Orca's first report. */
export type RunState = 'starting' | 'working' | 'blocked' | 'waiting' | 'done'
/** Storage keys: each to-do is `todo:<id>`, the ordered state list is `states`. */
export const TODO_KEY = 'todo:'
export const STATES_KEY = 'states'

export const RUN_STATES: RunState[] = ['starting', 'working', 'blocked', 'waiting', 'done']

/** One hand-off of a to-do to an agent CLI that Orca started in a terminal. */
export type AgentRun = {
  /** Orca's terminal id. It identifies the run: each launch opens a new terminal. */
  terminalId: string
  /** Orca's agent id, such as `claude` or `codex`. */
  agent: string
  workspaceId: string
  workspaceName: string
  startedAt: number
  state: RunState
  /** When `state` last changed. */
  stateAt: number
}

export type Filter = {
  text: string
  tags: string[]
  stateId: string
  priority: Priority | ''
  archived: boolean
}
export type Sort = 'manual' | 'priority' | 'updated' | 'created'

export const PRIORITIES: Priority[] = ['high', 'med', 'low', 'none']
export const PRIORITY_LABEL: Record<Priority, string> = { none: 'No priority', low: 'Low', med: 'Medium', high: 'High' }
const PRIORITY_RANK: Record<Priority, number> = { high: 0, med: 1, low: 2, none: 3 }

export const DEFAULT_STATES: State[] = [
  { id: 'backlog', name: 'Backlog', color: '#8b8b8b', closed: false },
  { id: 'todo', name: 'ToDo', color: '#3b82f6', closed: false },
  { id: 'doing', name: 'In Progress', color: '#f59e0b', closed: false },
  { id: 'done', name: 'Done', color: '#22c55e', closed: true }
]

export const EMPTY_FILTER: Filter = { text: '', tags: [], stateId: '', priority: '', archived: false }

export const uid = (): string => crypto.randomUUID()

export function normalizeTags(input: string): string[] {
  const tags = input.split(/[,\s]+/).map((t) => t.replace(/^#/, '').trim().toLowerCase())
  return [...new Set(tags.filter(Boolean))]
}

const QUICK_PRIORITY = new Map<string, Priority>([
  ['high', 'high'],
  ['h', 'high'],
  ['med', 'med'],
  ['m', 'med'],
  ['low', 'low'],
  ['l', 'low']
])

/**
 * Reads a composer line such as `Fix login #auth !high`: each `#tag` word becomes a tag and one
 * `!high` / `!med` / `!low` (or `!h` / `!m` / `!l`) the priority; the other words are the title.
 * A number such as `#123` is not a tag.
 * A line made only of these keeps its whole text as the title, so nothing typed is lost.
 */
export function parseQuickAdd(line: string): { title: string; tags: string[]; priority?: Priority } {
  const tags: string[] = []
  const rest: string[] = []
  let priority: Priority | undefined
  for (const word of line.trim().split(/\s+/)) {
    const quick = word.startsWith('!') ? QUICK_PRIORITY.get(word.slice(1).toLowerCase()) : undefined
    // `#123` stays in the title: it is an issue number, not a tag.
    if (/^#(?!\d+$)[^#]+$/.test(word)) tags.push(...normalizeTags(word))
    else if (quick && !priority) priority = quick
    else rest.push(word)
  }
  if (!rest.length) return { title: line.trim(), tags: [] }
  return { title: rest.join(' '), tags: [...new Set(tags)], ...(priority && { priority }) }
}

/** Applies a patch and keeps `closedAt` in step with whether the new state is closed. */
export function patchTodo(todo: Todo, patch: Partial<Todo>, states: State[], now = Date.now()): Todo {
  const next = { ...todo, ...patch, updatedAt: now }
  const closed = states.find((s) => s.id === next.stateId)?.closed ?? false
  if (closed && !next.closedAt) next.closedAt = now
  if (!closed) delete next.closedAt
  return next
}

export function matches(todo: Todo, f: Filter): boolean {
  if (todo.archived !== f.archived) return false
  if (f.stateId && todo.stateId !== f.stateId) return false
  if (f.priority && todo.priority !== f.priority) return false
  if (f.tags.length && !f.tags.every((t) => todo.tags.includes(t))) return false
  const q = f.text.trim().toLowerCase()
  return !q || `${todo.title}\n${todo.description}`.toLowerCase().includes(q)
}

export function sortTodos(todos: Todo[], sort: Sort): Todo[] {
  const list = [...todos]
  if (sort === 'priority')
    return list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order)
  if (sort === 'updated') return list.sort((a, b) => b.updatedAt - a.updatedAt)
  if (sort === 'created') return list.sort((a, b) => b.createdAt - a.createdAt)
  return list.sort((a, b) => a.order - b.order)
}

/** An order value that places a todo before `beforeId` in its state, or last when null. */
export function orderBefore(todos: Todo[], stateId: string, beforeId: string | null): number {
  const column = sortTodos(
    todos.filter((t) => t.stateId === stateId && !t.archived),
    'manual'
  )
  if (!beforeId) return (column.at(-1)?.order ?? 0) + 1
  const i = column.findIndex((t) => t.id === beforeId)
  if (i < 0) return (column.at(-1)?.order ?? 0) + 1
  const prev = i > 0 ? column[i - 1].order : column[i].order - 2
  return (prev + column[i].order) / 2
}

export type Stats = {
  total: number
  open: number
  closed: number
  doneThisWeek: number
  perState: { state: State; count: number }[]
}

export function stats(todos: Todo[], states: State[], now = Date.now()): Stats {
  const live = todos.filter((t) => !t.archived)
  const closedIds = new Set(states.filter((s) => s.closed).map((s) => s.id))
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const closed = live.filter((t) => closedIds.has(t.stateId)).length
  return {
    total: live.length,
    open: live.length - closed,
    closed,
    // Archived todos still count: archiving a finished todo should not erase the week's progress.
    doneThisWeek: todos.filter((t) => closedIds.has(t.stateId) && (t.closedAt ?? 0) >= weekAgo).length,
    perState: states.map((state) => ({ state, count: live.filter((t) => t.stateId === state.id).length }))
  }
}

export function allTags(todos: Todo[]): string[] {
  return [...new Set(todos.flatMap((t) => t.tags))].sort()
}

// --- stored data validation: storage holds whatever was written, by any version of the plugin ---

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string'
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** A stored todo, or null when the value is not a usable todo. Optional fields get defaults. */
export function parseTodo(value: unknown): Todo | null {
  if (!isRecord(value)) return null
  const { id, title, stateId, order, createdAt, updatedAt } = value
  if (!isString(id) || !isString(title) || !isString(stateId)) return null
  if (!isNumber(order) || !isNumber(createdAt) || !isNumber(updatedAt)) return null
  const priority = PRIORITIES.includes(value.priority as Priority) ? (value.priority as Priority) : 'none'
  const todo: Todo = {
    id,
    title,
    stateId,
    order,
    createdAt,
    updatedAt,
    description: isString(value.description) ? value.description : '',
    tags: Array.isArray(value.tags) ? value.tags.filter(isString) : [],
    priority,
    archived: value.archived === true,
    runs: Array.isArray(value.runs) ? value.runs.map(parseRun).filter((r): r is AgentRun => r !== null) : []
  }
  if (isNumber(value.closedAt)) todo.closedAt = value.closedAt
  return todo
}

/** A stored agent run, or null when it is not usable. Older plugin versions stored none. */
function parseRun(value: unknown): AgentRun | null {
  if (!isRecord(value)) return null
  const { terminalId, agent, workspaceId, workspaceName, startedAt, state, stateAt } = value
  if (!isString(terminalId) || !isString(agent) || !isString(workspaceId) || !isString(workspaceName)) return null
  if (!isNumber(startedAt)) return null
  return {
    terminalId,
    agent,
    workspaceId,
    workspaceName,
    startedAt,
    state: RUN_STATES.includes(state as RunState) ? (state as RunState) : 'starting',
    stateAt: isNumber(stateAt) ? stateAt : startedAt
  }
}

/** The stored state list, or null when it is missing, empty or malformed. */
export function parseStates(value: unknown): State[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const list: State[] = []
  for (const s of value) {
    if (!isRecord(s) || !isString(s.id) || !isString(s.name) || !isString(s.color)) return null
    list.push({ id: s.id, name: s.name, color: s.color, closed: s.closed === true })
  }
  return list
}
