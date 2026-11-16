// Reading and writing the plugin's storage from the worker, and its settings. Every stored value
// is parsed before use: storage holds whatever any version of the plugin wrote.

import { DEFAULT_STATES, parseStates, parseTodo, STATES_KEY, TODO_KEY, type State, type Todo } from '../model'
import { parseSettings, type Settings } from '../settings'
import type { WorkerOrca } from './host'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Orca's error code for a failed call, for the log. Never the message: it may quote user data. */
export const errorCode = (error: unknown): string =>
  isRecord(error) && typeof error.code === 'string' ? error.code : 'action_failed'

/** One stored value, or null when the key is absent. */
export async function readValue(orca: WorkerOrca, key: string): Promise<unknown> {
  const answer = await orca.host.call('storage.get', { key })
  return isRecord(answer) ? answer.value : null
}

export async function writeValue(orca: WorkerOrca, key: string, value: unknown): Promise<void> {
  await orca.host.call('storage.set', { key, value })
}

/** Every to-do and the states, skipping records that are not valid. */
export async function readAll(orca: WorkerOrca): Promise<{ todos: Todo[]; states: State[] }> {
  const answer = await orca.host.call('storage.keys', {})
  const keys = isRecord(answer) && Array.isArray(answer.keys) ? answer.keys.filter((k) => typeof k === 'string') : []
  const values = await Promise.all(keys.filter((k) => k.startsWith(TODO_KEY)).map((k) => readValue(orca, k)))
  const todos = values.map(parseTodo).filter((t): t is Todo => t !== null)
  return { todos, states: parseStates(await readValue(orca, STATES_KEY)) ?? DEFAULT_STATES }
}

/** The settings, each unusable one at its default. Defaults too when Orca will not answer. */
export async function readSettings(orca: WorkerOrca): Promise<Settings> {
  try {
    return parseSettings(await orca.settings.get())
  } catch (error) {
    orca.log(`Could not read settings; using the defaults (${errorCode(error)})`)
    return parseSettings(null)
  }
}
