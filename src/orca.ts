// The slice of Orca's frame API (`window.orca`) this plugin uses. Outside Orca (a plain browser,
// for previewing the UI) it falls back to localStorage so the app still runs.

import { AgentError, type AgentOp } from './errors'
import { log } from './log'
import {
  parseLaunchAnswer,
  parseWorkspacesAnswer,
  REQUEST,
  type LaunchAnswer,
  type LaunchInput,
  type WorkspacesAnswer
} from './protocol'

type Disposable = { dispose(): void }

export type FrameStorage = {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  onDidChange(fn: (e: { key: string }) => void): Disposable
}

export type OrcaFrame = {
  storage: FrameStorage
  shell?: { openExternal(url: string): Promise<{ opened: boolean }> }
  host?: { has(method: string): boolean }
  /** Requests to this plugin's own worker. Present when the plugin has one. */
  plugin?: { request(name: string, input?: unknown, options?: { timeoutMs?: number }): Promise<unknown> }
}

declare global {
  interface Window {
    orca?: OrcaFrame
  }
}

const PREFIX = 'orca-todos:'

/** The browser-preview stand-in for Orca storage. Exported so tests can exercise it directly. */
export const browserStorage: FrameStorage = {
  async get(key) {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? null : JSON.parse(raw)
  },
  async set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  },
  async delete(key) {
    localStorage.removeItem(PREFIX + key)
  },
  async keys() {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length))
  },
  onDidChange(fn) {
    const listener = (e: StorageEvent): void => {
      if (e.key?.startsWith(PREFIX)) fn({ key: e.key.slice(PREFIX.length) })
    }
    window.addEventListener('storage', listener)
    return { dispose: () => window.removeEventListener('storage', listener) }
  }
}

export const storage: FrameStorage = window.orca?.storage ?? browserStorage

/** Opens http(s)/mailto links in the OS browser; Orca needs this to come from a click. */
export function openExternal(url: string): void {
  if (!window.orca?.shell) {
    window.open(url, '_blank', 'noopener')
    return
  }
  window.orca.shell
    .openExternal(url)
    .catch((error: unknown) => log.error('Could not open link', { op: 'openExternal' }, error))
}

/** Whether this Orca can reach the plugin's worker. False in the browser preview. */
export function workerAvailable(): boolean {
  const orca = window.orca
  return Boolean(orca?.plugin && (orca.host?.has('plugin.request') ?? true))
}

const errorCode = (error: unknown): string =>
  typeof error === 'object' && error !== null && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : 'action_failed'

/** Asks the worker and checks its answer. Rejects with an AgentError naming Orca's error code. */
async function askWorker<T>(op: AgentOp, name: string, input: unknown, parse: (v: unknown) => T | null): Promise<T> {
  const plugin = window.orca?.plugin
  if (!plugin) throw new AgentError(op, 'unavailable')
  let answer: unknown
  try {
    answer = await plugin.request(name, input, { timeoutMs: 15_000 })
  } catch (cause) {
    throw new AgentError(op, errorCode(cause), { cause })
  }
  const parsed = parse(answer)
  if (!parsed) throw new AgentError(op, 'bad_answer')
  return parsed
}

/** Every workspace Orca reaches, and which one is focused. */
export const listWorkspaces = (): Promise<WorkspacesAnswer> =>
  askWorker('workspaces', REQUEST.workspaces, {}, parseWorkspacesAnswer)

/** Starts an agent in a workspace with the prompt. Answers with the agent's terminal. */
export const launchAgent = (input: LaunchInput): Promise<LaunchAnswer> =>
  askWorker('launch', REQUEST.launch, input, parseLaunchAnswer)
