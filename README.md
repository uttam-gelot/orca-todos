# ToDos for Orca

Personal to-dos inside Orca. A full-size tab with a navigator, list or board, and details; and a
compact version in the right sidebar. Both share the same data.

- Custom states: add, rename, recolor, reorder, delete. "Closed" states count as done.
- To-dos: title, markdown notes (links open in your browser), tags, priority, archive, undo delete.
- List (grouped by state) and Board (drag cards between columns).
- Navigator: all, each state, each tag, archived, with counts and the week's numbers.
- Search, priority filter, ordering.
- Keyboard-first. Press `?` for the full list.

## Keyboard

| Keys                | Action                           |
| ------------------- | -------------------------------- |
| `J` `K` / `↓` `↑`   | Next / previous to-do            |
| `H` `L` / `←` `→`   | Previous / next column (board)   |
| `[` `]`             | Previous / next scope            |
| `N`                 | New to-do                        |
| `/`                 | Search                           |
| `V`                 | Switch list / board              |
| `↵`                 | Open details (again: edit title) |
| `E`                 | Edit notes                       |
| `1`–`9`             | Move to state 1–9                |
| `Shift+H` `Shift+L` | Move to previous / next state    |
| `X`                 | Mark done / reopen               |
| `P`                 | Cycle priority                   |
| `A`                 | Archive / unarchive              |
| `⌫`                 | Delete (`⌘Z` / `Ctrl+Z` to undo) |
| `Esc`               | Close, clear, go back            |

## Open it in Orca (1.4.246+)

Settings → Plugins → **Turn on plugins** → **Development folders…** → add this folder → review and
enable.

- **Center tab (main view):** **+** in the tab bar, or the command palette → **Open ToDos board**.
  That creates `untitled.todos`. For a tab titled **ToDos**, double-click the tab and rename the file
  to `ToDos`, or create a file named `ToDos` (no extension) and open it. A file named `ToDos` or
  ending in `.todos` opens the board. The file stays empty: the to-dos live in plugin storage.
- **Sidebar:** the ToDos icon in the right sidebar.

The sidebar cannot open the center tab itself: that needs a full-access worker and the
`workspace:write` capability, and this plugin asks only for `storage:own`.

To install a copy instead of a development folder, run `bun run pack` and choose the `release/`
folder (it has no `node_modules` symlinks, which Orca refuses).

## Develop

```sh
bun install
lefthook install          # once per clone: wires the pre-push checks
bun run build             # bundle to dist/ (or: bun run watch)
bun test                  # all tests (bun run test:unit / test:integration)
bun run typecheck         # TypeScript 6, strict
bun run lint              # ESLint
bun run format            # Prettier (format:check to only check)
bun run pack              # build a release/ copy to install
```

Before a push, `lefthook` runs a gitleaks secret scan, the tests, ESLint and a Prettier check.

Source layout: `src/model.ts` (types and pure rules), `src/store.ts` (signals, storage, sync),
`src/orca.ts` (the only access to the Orca frame API), `src/components/` (each with its own CSS),
`src/styles.css` (tokens and resets). Tests use `bun:test` with happy-dom and an in-memory fake of
the Orca frame (`tests/factories/orca-frame.ts`), so they never need Orca running.

`dist/` is committed: Orca loads it as-is, and plugin frames have no network.

To preview in a browser, serve the folder (`python3 -m http.server`) and open
`/.impeccable/review/seed.html` (sample data; `?surface=panel`, `?view=board`, `?empty=1`). Outside
Orca the app stores data in `localStorage`.

## Licenses

MIT. Bundles the Geist font (SIL Open Font License, `dist/OFL.txt`).
