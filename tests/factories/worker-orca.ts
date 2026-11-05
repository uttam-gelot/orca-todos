// A stand-in for the `orca` object Orca hands the worker's `activate`. Host calls answer from
// `answers`; a missing method rejects like Orca does for a call the plugin may not make.

import type { WorkerOrca } from '../../src/worker/host'

type Answer = (params: unknown) => unknown

export type FakeWorkerOrca = WorkerOrca & {
  /** Host answers by method name. */
  answers: Map<string, Answer>
  /** Every host call made, in order. */
  calls: { method: string; params: unknown }[]
  /** Handlers the worker registered with `panels.handle`, by name. */
  handlers: Map<string, (input: unknown) => unknown>
  logs: string[]
}

export function createFakeWorkerOrca(answers: Record<string, Answer> = {}): FakeWorkerOrca {
  const fake: FakeWorkerOrca = {
    answers: new Map(Object.entries(answers)),
    calls: [],
    handlers: new Map(),
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
    log: (message) => void fake.logs.push(message)
  }
  return fake
}
