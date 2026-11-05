// A stand-in for the `orca` object Orca hands the worker's `activate`. Host calls answer from
// `answers`; a missing method rejects like Orca does for a call the plugin may not make.
// `storage.get` and `storage.set` answer from `stored` unless a test overrides them.

import type { WorkerOrca } from '../../src/worker/host'

type Answer = (params: unknown) => unknown
type Params = { key: string; value?: unknown }

export type FakeWorkerOrca = WorkerOrca & {
  /** Host answers by method name. */
  answers: Map<string, Answer>
  /** Every host call made, in order. */
  calls: { method: string; params: unknown }[]
  /** The plugin's storage, by key. */
  stored: Map<string, unknown>
  /** Handlers the worker registered with `panels.handle`, by name. */
  handlers: Map<string, (input: unknown) => unknown>
  /** Handlers the worker registered with `events.on`, by event. */
  listeners: Map<string, (payload: unknown) => unknown>
  logs: string[]
}

export function createFakeWorkerOrca(answers: Record<string, Answer> = {}): FakeWorkerOrca {
  const stored = new Map<string, unknown>()
  const fake: FakeWorkerOrca = {
    answers: new Map<string, Answer>([
      ['storage.get', (p) => ({ value: structuredClone(stored.get((p as Params).key) ?? null) })],
      ['storage.set', (p) => (stored.set((p as Params).key, structuredClone((p as Params).value)), { ok: true })],
      ...Object.entries(answers)
    ]),
    calls: [],
    stored,
    handlers: new Map(),
    listeners: new Map(),
    logs: [],
    host: {
      async call(method, params) {
        fake.calls.push({ method, params })
        const answer = fake.answers.get(method)
        if (!answer) throw Object.assign(new Error(`${method} not permitted`), { code: 'not_permitted' })
        return answer(params)
      }
    },
    panels: {
      handle(name, handler) {
        fake.handlers.set(name, handler)
        return { dispose: () => fake.handlers.delete(name) }
      }
    },
    events: {
      on(event, handler) {
        fake.listeners.set(event, handler)
        return { dispose: () => fake.listeners.delete(event) }
      }
    },
    log: (message) => void fake.logs.push(message)
  }
  return fake
}
