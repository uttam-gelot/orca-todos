// An in-memory stand-in for Orca's frame API (`window.orca`), so tests never need a running Orca.
// Values are cloned on the way in and out, like real storage, and every write notifies listeners.

import type { OrcaFrame } from '../../src/orca'

type Listener = (e: { key: string }) => void
type RequestHandler = (input: unknown) => unknown
type Failure = 'keys' | 'get' | 'set' | 'delete'

export type FakeOrcaFrame = OrcaFrame & {
  /** The stored values, by key. Tests may read it to check what was persisted. */
  data: Map<string, unknown>
  /** Makes the next call of `op` reject with a storage error. */
  failNext(op: Failure): void
  /** Writes a key as another surface would (the sidebar while the tab is open) and notifies. */
  writeFromElsewhere(key: string, value: unknown): void
  /** Clears data, listeners and pending failures. */
  reset(): void
  opened: string[]
  /** The plugin worker's request handlers, by name. A missing name rejects with `unknown_method`. */
  handlers: Map<string, RequestHandler>
  /** Every worker request sent, in order. */
  requests: { name: string; input: unknown }[]
}

export function createFakeOrcaFrame(): FakeOrcaFrame {
  const data = new Map<string, unknown>()
  const listeners = new Set<Listener>()
  const failures = new Set<Failure>()
  const opened: string[] = []
  const handlers = new Map<string, RequestHandler>()
  const requests: { name: string; input: unknown }[] = []

  const check = (op: Failure): void => {
    if (!failures.delete(op)) return
    throw new Error(`fake storage: ${op} failed`)
  }
  const notify = (key: string): void => {
    for (const fn of listeners) fn({ key })
  }

  return {
    data,
    opened,
    handlers,
    requests,
    storage: {
      async get(key) {
        check('get')
        return data.has(key) ? structuredClone(data.get(key)) : null
      },
      async set(key, value) {
        check('set')
        data.set(key, structuredClone(value))
        notify(key)
      },
      async delete(key) {
        check('delete')
        data.delete(key)
        notify(key)
      },
      async keys() {
        check('keys')
        return [...data.keys()]
      },
      onDidChange(fn) {
        listeners.add(fn)
        return { dispose: () => listeners.delete(fn) }
      }
    },
    shell: {
      async openExternal(url) {
        opened.push(url)
        return { opened: true }
      }
    },
    host: { has: () => true },
    plugin: {
      async request(name, input) {
        requests.push({ name, input: structuredClone(input) })
        const handler = handlers.get(name)
        if (!handler) throw Object.assign(new Error(`No handler for ${name}`), { code: 'unknown_method' })
        return structuredClone(await handler(structuredClone(input)))
      }
    },
    failNext: (op) => void failures.add(op),
    writeFromElsewhere(key, value) {
      data.set(key, structuredClone(value))
      notify(key)
    },
    reset() {
      data.clear()
      listeners.clear()
      failures.clear()
      opened.length = 0
      handlers.clear()
      requests.length = 0
    }
  }
}
