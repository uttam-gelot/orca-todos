// The status bar item: how many to-dos are open, and how many of those are high priority. Orca keeps
// a worker with status bar items running while the plugin is enabled, so the count follows every
// write from either surface without a panel open. Pressing the item runs a manifest command that
// shows or hides the right sidebar, where the ToDos panel lives.

import { en, type Messages } from '../i18n/en'
import { STATES_KEY, TODO_KEY, type State, type Todo } from '../model'
import { errorCode, readAll } from './data'
import type { WorkerOrca } from './host'

/** The item's id in the manifest's `contributes.statusBarItems`. */
export const STATUS_ITEM = 'open-count'

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
    updateStatus(orca).catch((error: unknown) => orca.log(`Could not update the status bar item (${errorCode(error)})`))
  }
  orca.storage.onDidChange((change) => {
    if (!change.key.startsWith(TODO_KEY) && change.key !== STATES_KEY) return
    clearTimeout(timer)
    timer = setTimeout(run, delayMs)
  })
  run()
}
