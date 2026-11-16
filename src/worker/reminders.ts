// Due reminders: when an open to-do comes due, the worker asks Orca to show a notification. A due
// with a time is reminded at that time; a day with no time, at the `reminderTime` setting that
// morning. The worker does it, so reminders arrive with no panel open.
//
// The `reminders` storage key records, per to-do, the due it was last reminded about. Each due is
// reminded once, and changing a to-do's due arms its reminder again. A reminder missed by more than
// GRACE_MS (Orca was closed) is recorded without a notification: an old one would only be noise.

import { hasTime, remindAt } from '../due'
import { en, type Messages } from '../i18n/en'
import type { Todo } from '../model'
import { errorCode, readAll, readSettings, readValue, writeValue } from './data'
import type { Disposable, WorkerOrca } from './host'

export const REMINDERS_KEY = 'reminders'
const GRACE_MS = 12 * 60 * 60 * 1000
/** More to-dos than this coming due at once share one notification. */
const MAX_SEPARATE = 3

type Reminded = Record<string, string>

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The stored record, keeping only entries of the right shape. */
function parseReminded(value: unknown): Reminded {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  )
}

/** The notifications to show for to-dos coming due together. */
export function notificationsFor(due: Todo[], m: Messages = en): { title: string; body: string }[] {
  if (due.length > MAX_SEPARATE)
    return [{ title: m.reminderMany(due.length), body: due.map((t) => t.title).join(', ') }]
  return due.map((t) => ({ title: t.due && hasTime(t.due) ? m.reminderDueNow : m.reminderDueToday, body: t.title }))
}

/**
 * Shows the reminders that are due and records them. Answers how many to-dos it reminded about.
 * `m` is the language of the notification text.
 */
export async function remind(orca: WorkerOrca, now = Date.now(), m: Messages = en): Promise<number> {
  const { dueReminders, reminderTime } = await readSettings(orca)
  if (!dueReminders) return 0
  const { todos, states } = await readAll(orca)
  const closed = new Set(states.filter((s) => s.closed).map((s) => s.id))
  const open = todos.filter((t): t is Todo & { due: string } => Boolean(t.due) && !t.archived && !closed.has(t.stateId))
  const before = parseReminded(await readValue(orca, REMINDERS_KEY))
  // Only open to-dos with a due stay in the record, so it never outgrows the list.
  const after: Reminded = Object.fromEntries(open.filter((t) => before[t.id] === t.due).map((t) => [t.id, t.due]))
  const fresh: Todo[] = []
  for (const todo of open) {
    if (after[todo.id]) continue
    const at = remindAt(todo.due, reminderTime)
    if (at > now) continue
    after[todo.id] = todo.due
    if (now - at <= GRACE_MS) fresh.push(todo)
  }
  for (const note of notificationsFor(fresh, m)) {
    try {
      await orca.host.call('notifications.show', note)
    } catch (error) {
      orca.log(`Could not show a due reminder (${errorCode(error)})`)
    }
  }
  if (JSON.stringify(after) !== JSON.stringify(before)) await writeValue(orca, REMINDERS_KEY, after)
  if (fresh.length) orca.log(`Reminded about ${fresh.length} due to-dos`)
  return fresh.length
}

/** Checks reminders now, every `everyMs`, and after a settings change. Dispose to stop. */
export function followReminders(orca: WorkerOrca, everyMs = 60_000): Disposable {
  let running = false
  const run = (): void => {
    // A slow check must not overlap the next one, or a to-do could be reminded twice.
    if (running) return
    running = true
    remind(orca)
      .catch((error: unknown) => orca.log(`Could not check due reminders (${errorCode(error)})`))
      .finally(() => (running = false))
  }
  const timer = setInterval(run, everyMs)
  const listening = orca.settings.onDidChange(run)
  run()
  return {
    dispose() {
      clearInterval(timer)
      listening.dispose()
    }
  }
}
