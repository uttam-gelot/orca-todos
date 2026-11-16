// The status bar item: how many to-dos are open, and how many of those are high priority. Orca keeps
// a worker with status bar items running while the plugin is enabled, so the count follows every
// write from either surface without a panel open. Pressing the item runs a manifest command that
// shows or hides the right sidebar, where the ToDos panel lives.

import { DEFAULT_STATES, parseStates, parseTodo, STATES_KEY, TODO_KEY, type State, type Todo } from '../model'
import { en, type Messages } from '../i18n/en'
import type { WorkerOrca } from './host'

/** The item's id in the manifest's `contributes.statusBarItems`. */
export const STATUS_ITEM = 'open-count'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** What the item says for these to-dos, in the language of `m`: "5 open · 2 high", or "No open to-dos". */
export function statusFor(todos: Todo[], states: State[], m: Messages = en): { text: string; tooltip: string } {
  const closed = new Set(states.filter((s) => s.closed).map((s) => s.id))
  const open = todos.filter((t) => !t.archived && !closed.has(t.stateId))
  const high = open.filter((t) => t.priority === 'high').length
  return {
    text: open.length ? m.statusOpen(open.length, high) : m.statusNone,
    tooltip: m.statusTip(open.length, high)
  }
}

const read = async (orca: WorkerOrca, key: string): Promise<unknown> => {
  const answer = await orca.host.call('storage.get', { key })
  return isRecord(answer) ? answer.value : null
}

/** Reads every to-do and the states from storage, skipping records that are not valid. */
async function readAll(orca: WorkerOrca): Promise<{ todos: Todo[]; states: State[] }> {
  const answer = await orca.host.call('storage.keys', {})
  const keys = isRecord(answer) && Array.isArray(answer.keys) ? answer.keys.filter((k) => typeof k === 'string') : []
  const values = await Promise.all(keys.filter((k) => k.startsWith(TODO_KEY)).map((k) => read(orca, k)))
  const todos = values.map(parseTodo).filter((t): t is Todo => t !== null)
  return { todos, states: parseStates(await read(orca, STATES_KEY)) ?? DEFAULT_STATES }
}

/** Counts the to-dos again and shows the result on the item. */
export async function updateStatus(orca: WorkerOrca): Promise<void> {
  const { todos, states } = await readAll(orca)
  await orca.host.call('statusBar.update', { id: STATUS_ITEM, ...statusFor(todos, states), visible: true })
}

/**
 * Keeps the item current: once now, then after storage changes. A burst of writes (archiving every
 * closed to-do) counts once. A failure leaves the old count and goes to the plugin log; the next
 * change tries again.
 */
export function followStatus(orca: WorkerOrca, delayMs = 300): void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = (): void => {
    updateStatus(orca).catch((error: unknown) => {
      const code = isRecord(error) && typeof error.code === 'string' ? error.code : 'action_failed'
      orca.log(`Could not update the status bar item (${code})`)
    })
  }
  orca.storage.onDidChange((change) => {
    if (!change.key.startsWith(TODO_KEY) && change.key !== STATES_KEY) return
    clearTimeout(timer)
    timer = setTimeout(run, delayMs)
  })
  run()
}
