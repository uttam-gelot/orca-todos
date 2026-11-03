// Entry for the screenshot build only (`bun run shots`). It replaces the plugin's storage with the
// sample to-dos, then starts the real app. It runs in a separate demo copy of the plugin, so it
// never touches the to-dos of the installed plugin.

import { storage } from '../../src/orca'
import { SAMPLE_STATES, sampleTodos } from './sample-data'

/** A new id for each demo build, set by run.ts, so each `bun run shots` writes the samples once. */
declare const DEMO_SEED_ID: string
const SEED_KEY = 'demo:seed'

type Disposable = { dispose(): void }
type DocumentApi = { onDidChange?(fn: () => void): Disposable }

const mode = document.body.dataset.mode === 'board' ? 'board' : 'panel'

// The sidebar opens in the list view and the tab in the board view. The shot script presses `v`
// to show the tab's list view.
localStorage.setItem(`orca-todos:prefs:${mode}`, JSON.stringify({ view: mode === 'board' ? 'board' : 'list' }))

// `orca plugin shot --editor` waits until the editor asks for its document. The board keeps its
// data in plugin storage, not in the file, so it subscribes only to tell the shot that it is ready.
const orcaDocument = (window as unknown as { orca?: { document?: DocumentApi } }).orca?.document
orcaDocument?.onDidChange?.(() => {})

// Top-level await: the store's load() in src/main must read the sample data, not the old data.
// Only the first frame of a run writes it: Orca allows a plugin's frames 120 calls per 10 s in all.
if ((await storage.get(SEED_KEY)) !== DEMO_SEED_ID) {
  const stale = (await storage.keys()).filter((key) => key.startsWith('todo:'))
  await Promise.all(stale.map((key) => storage.delete(key)))
  await storage.set('states', SAMPLE_STATES)
  await Promise.all(sampleTodos().map((todo) => storage.set(`todo:${todo.id}`, todo)))
  await storage.set(SEED_KEY, DEMO_SEED_ID)
}

await import('../../src/main')
