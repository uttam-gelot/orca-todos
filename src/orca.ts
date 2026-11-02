// The slice of Orca's frame API (`window.orca`) this plugin uses. Outside Orca (a plain browser,
// for previewing the UI) it falls back to localStorage so the app still runs.

import { log } from './log'

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
