// The status bar item: how many to-dos are open, and how many of those are high priority or past
// due. Orca keeps a worker with status bar items running while the plugin is enabled, so the count
// follows every write from either surface without a panel open. Pressing the item runs a manifest
// command that shows or hides the right sidebar, where the ToDos panel lives.

import { LOCALE_KEY } from '../i18n'
import { en, type Messages } from '../i18n/en'
import { inDueFilter, STATES_KEY, TODO_KEY, type State, type Todo } from '../model'
import { errorCode, readAll, readMessages } from './data'
import type { Disposable, WorkerOrca } from './host'

/** The item's id in the manifest's `contributes.statusBarItems`. */
export const STATUS_ITEM = 'open-count'

/** What the item says for these to-dos, in the language of `m`: "5 open · 2 high", or "No open to-dos". */
export function statusFor(
  todos: Todo[],
  states: State[],
  m: Messages = en,
  now = Date.now()
): { text: string; tooltip: string } {
  const closed = new Set(states.filter((s) => s.closed).map((s) => s.id))
  const open = todos.filter((t) => !t.archived && !closed.has(t.stateId))
  const high = open.filter((t) => t.priority === 'high').length
  const overdue = open.filter((t) => inDueFilter(t, 'overdue', now)).length
  return {
    text: open.length ? m.statusOpen(open.length, high, overdue) : m.statusNone,
    tooltip: m.statusTip(open.length, high, overdue)
  }
}

/** Counts the to-dos again and shows the result on the item. */
export async function updateStatus(orca: WorkerOrca): Promise<void> {
  const { todos, states } = await readAll(orca)
  const m = await readMessages(orca)
  await orca.host.call('statusBar.update', { id: STATUS_ITEM, ...statusFor(todos, states, m), visible: true })
}

/**
 * Keeps the item current: once now, then after storage changes. A burst of writes (archiving every
 * closed to-do) counts once. A failure leaves the old count and goes to the plugin log; the next
 * change tries again.
 */
export function followStatus(orca: WorkerOrca, delayMs = 300, everyMs = 60_000): Disposable {
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = (): void => {
    updateStatus(orca).catch((error: unknown) => orca.log(`Could not update the status bar item (${errorCode(error)})`))
  }
  const soon = (): void => {
    clearTimeout(timer)
    timer = setTimeout(run, delayMs)
  }
  const listening = orca.storage.onDidChange((change) => {
    if (change.key.startsWith(TODO_KEY) || change.key === STATES_KEY || change.key === LOCALE_KEY) soon()
  })
  // The language setting changes the item's words.
  const settingsChanges = orca.settings.onDidChange(soon)
  // A to-do becomes overdue with no write at all, so the count also refreshes each minute.
  const clock = setInterval(run, everyMs)
  run()
  return {
    dispose() {
      clearTimeout(timer)
      clearInterval(clock)
      listening.dispose()
      settingsChanges.dispose()
    }
  }
}
