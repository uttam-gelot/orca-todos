---
name: "project-overview"
description: "This project's purpose, scope, and high-level architecture, and how its stack fits together."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Orca ToDos

A personal to-do plugin for Orca, the agent-orchestrator IDE. It gives Orca two surfaces over the same stored to-dos:

- a full-size center tab (navigator, list or board, detail pane), opened from a `.todos` file;
- a compact panel in the right sidebar.

Users manage custom states, titles, markdown notes, tags, priorities, and archives. They can start a coding agent on a to-do in any Orca workspace and see its status on the row and card. They browse in a grouped list or a draggable board, with search, filters, sorting, and a keyboard-first map. Orca's own shortcuts (Cmd/Ctrl chords) always pass through.

## Architecture

- `orca-plugin.json` declares the two surfaces (`panel.html`, `board.html`), the worker (`main: dist/worker.js`, `execution: trusted-worker`), the `agent.status.changed` event, and the capabilities `storage:own`, `workspace:read`, `workspace:write`, `agent:launch`, `agent:read`, `terminal:send`. Frames run sandboxed with no network.
- `src/worker/` is the worker. Only a worker may list workspaces with their ids and start agents, so the panel asks it through `orca.plugin.request` (`src/protocol.ts` names the requests and parses both sides). The worker indexes each agent terminal to its to-do and writes status events onto the to-do's `runs`, so a run's status updates with no panel open.
- `src/agents.ts` holds the pure agent rules (agent list, prompt, start command, run index, workspace labels) shared by the panel and the worker.
- `src/main.tsx` imports `styles.css`, renders `<App />`, and calls `load()`. `bun run build` bundles everything into `dist/app.js` and `dist/app.css`. `dist/` is committed because Orca loads it as-is.
- `src/orca.ts` wraps `window.orca` (frame storage and `shell.openExternal`). Outside Orca, storage falls back to `localStorage` so the UI can be previewed in a browser.
- `src/store.ts` holds state as `@preact/signals`. Each to-do is stored under its own key (`todo:<id>`), the states under `states`. Writes go through `persist()`, which reports a failure in `saveError`. `storage.onDidChange` re-reads one key, which keeps the sidebar and the tab in sync.
- `src/model.ts` holds types and pure rules (filter, sort, order, stats) plus `parseTodo` / `parseStates` for stored data.
- `src/App.tsx` and `src/components/` render the UI. Wide layouts show three panes. Narrow layouts (the sidebar) turn the navigator into a select and the details into a sheet.
- `src/keys.ts` is the keyboard map. `src/log.ts` is the logger. `src/errors.ts` holds `StorageError`.

## Stack

- TypeScript 6 (strict, ES2022, Bundler resolution). TypeScript 7 is not used yet because typescript-eslint does not support it.
- Preact 11, `@preact/signals`, `lucide-preact`, `marked` + `DOMPurify`, the Geist font (bundled).
- Bun for install, scripts, bundling, and tests (`bun:test` with happy-dom).
- Vanilla CSS with BEM, per-component stylesheets, and tokens in `src/styles.css`. Visual rules live in `DESIGN.md`; product context in `PRODUCT.md`.
- ESLint + Prettier. `lefthook` runs the checks at pre-push.

## Out of scope

- No backend, no sync service, no network calls.
- No configuration or environment variables: the plugin has no settings outside its own storage.
- The worker runs no commands of its own and reads no files. It only calls Orca's host API.
