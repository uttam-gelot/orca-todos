// Auto-archive: closed to-dos move to the archive a set number of days after they were closed, as
// the `autoArchiveDays` setting says. The worker does it, so it happens with no panel open: once
// at start, then every hour and whenever a setting changes.

import { staleClosed, TODO_KEY } from '../model'
import { errorCode, readAll, readSettings, writeValue } from './data'
import type { Disposable, WorkerOrca } from './host'

const HOUR_MS = 60 * 60 * 1000

/** Archives the closed to-dos that are old enough. Answers how many it archived. */
export async function autoArchive(orca: WorkerOrca, now = Date.now()): Promise<number> {
  const { autoArchiveDays } = await readSettings(orca)
  if (!autoArchiveDays) return 0
  const { todos, states } = await readAll(orca)
  const stale = staleClosed(todos, states, autoArchiveDays, now)
  for (const todo of stale) await writeValue(orca, TODO_KEY + todo.id, { ...todo, archived: true, updatedAt: now })
  if (stale.length) orca.log(`Auto-archived ${stale.length} closed to-dos`)
  return stale.length
}

/** Runs auto-archive now, every `everyMs`, and after a settings change. Dispose to stop. */
export function followArchive(orca: WorkerOrca, everyMs = HOUR_MS): Disposable {
  const run = (): void => {
    autoArchive(orca).catch((error: unknown) => orca.log(`Could not archive closed to-dos (${errorCode(error)})`))
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
