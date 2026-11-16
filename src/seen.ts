// "Not seen yet": an agent run that needs you, waits, or finished after you last looked at its
// to-do. Looking means selecting the to-do. The times live in this computer's localStorage, shared
// by the sidebar panel and the center tab; they are a view preference, not to-do data.

import { signal } from '@preact/signals'
import { latestRun } from './agents'
import { log } from './log'
import type { RunState, Todo } from './model'

const SEEN_KEY = 'orca-todos:seen'
/** To-dos remembered; older entries drop off. */
const MAX_SEEN = 200
/** Run states that ask for a look. Starting and working do not. */
const ATTENTION: ReadonlySet<RunState> = new Set<RunState>(['blocked', 'waiting', 'done'])

/** `since`: changes before this time count as seen, so runs from before this feature show no dot. */
export type Seen = { since: number; todos: Record<string, number> }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Reads stored times; anything unusable starts over from `now`. */
export function parseSeen(value: unknown, now: number): Seen {
  if (!isRecord(value) || typeof value.since !== 'number' || !isRecord(value.todos)) return { since: now, todos: {} }
  const todos: Record<string, number> = {}
  for (const [id, at] of Object.entries(value.todos)) if (typeof at === 'number') todos[id] = at
  return { since: value.since, todos }
}

/** True when the to-do's newest run changed to a state that asks for a look after it was last seen. */
export function isUnseen(todo: Todo, seen: Seen): boolean {
  const run = latestRun(todo)
  if (!run || !ATTENTION.has(run.state)) return false
  return run.stateAt > Math.max(seen.since, seen.todos[todo.id] ?? 0)
}

/** Records that the to-do was looked at, at `now`, keeping the newest `MAX_SEEN` entries. */
export function markSeen(seen: Seen, id: string, now: number): Seen {
  const entries = Object.entries({ ...seen.todos, [id]: now })
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SEEN)
  return { since: seen.since, todos: Object.fromEntries(entries) }
}

function read(): Seen {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return parseSeen(raw === null ? null : JSON.parse(raw), Date.now())
  } catch (error) {
    log.warn('Ignoring unreadable seen times', { op: 'readSeen', key: SEEN_KEY }, error)
    return { since: Date.now(), todos: {} }
  }
}

export const seen = signal<Seen>(read())

// The first run stores `since`, so a reload does not show old runs as new.
try {
  if (localStorage.getItem(SEEN_KEY) === null) localStorage.setItem(SEEN_KEY, JSON.stringify(seen.value))
} catch (error) {
  // Storage may be off; the marks then reset with each load.
  log.warn('Could not store seen times', { op: 'initSeen', key: SEEN_KEY }, error)
}

// The other surface (panel or tab) looked at a to-do.
window.addEventListener('storage', (e) => {
  if (e.key === SEEN_KEY) seen.value = read()
})

/** Marks the to-do as looked at now, here and in the other surface. */
export function lookAt(id: string): void {
  seen.value = markSeen(seen.value, id, Date.now())
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen.value))
  } catch (error) {
    // As above: the mark lasts until reload.
    log.warn('Could not store seen times', { op: 'lookAt', key: SEEN_KEY }, error)
  }
}
