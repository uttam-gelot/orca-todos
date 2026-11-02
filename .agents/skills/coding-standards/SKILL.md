---
name: "coding-standards"
description: "Naming, file organization, validation, and CSS conventions for this codebase."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Coding standards for Orca ToDos

Apply these conventions to the TypeScript, Preact 11, and vanilla CSS code of this Orca plugin. Do not add frameworks, libraries, or tooling that the project does not already use.

## TypeScript

- Make plugin boundaries explicit with types: Orca frame values, stored records, and shared state. Use `unknown` at untrusted boundaries, then narrow it. Do not use `any`.
- Let TypeScript infer obvious local types. Add explicit return types to exported functions.
- Use `const` by default. Prefer early returns and small functions over nested logic.
- Use async/await. Handle a rejected promise at the boundary that can add context or recover. Never discard a rejection with `void promise` when the operation can fail and the user would care.

## Naming

- `PascalCase` for components and types, `camelCase` for functions, variables, and signals, `UPPER_SNAKE_CASE` only for module-level constants (`STATES_KEY`, `MOD`).
- Name modules and functions by what they do for the user (`toggleDone`, `archiveClosed`, `parseTodo`), not by how they do it.

## File layout

```text
src/
  main.tsx          entry: imports styles.css, renders <App />, starts load()
  App.tsx, App.css  shell: panes, empty/error states, toasts
  components/       one component file + its own .css (ui.tsx holds shared primitives)
  model.ts          types and pure rules: filter, sort, order, stats, parseTodo/parseStates
  store.ts          signals, actions, persistence, cross-surface sync
  orca.ts           the only module that touches window.orca (with a localStorage fallback)
  keys.ts           keyboard map
  focus.ts          focus requests shared by keys.ts and components
  log.ts            the logger
  errors.ts         typed errors (StorageError)
  markdown.ts/.css  marked + DOMPurify, and the .md styles
  styles.css        global entry: tokens and resets only
tests/              see the testing skill
```

- One responsibility per module. UI does not call `storage` directly: it calls store actions.
- Export only what another module needs. Avoid circular imports: put state that both `keys.ts` and a component need in a small leaf module (as `focus.ts` does).
- Shared domain types live in `model.ts`, not in components.

## Validation

- Treat everything read from storage as `unknown`. Run it through `parseTodo` / `parseStates` (or a new parser in `model.ts`) before it reaches a signal. A type cast does not validate data.
- Skip an invalid record with a `log.warn`. Do not crash the whole load because of one bad record.

## CSS

- `styles.css` is the single global entry. It holds the design tokens on `:root` (colors mapped from Orca's `--orca-*` variables, spacing, type, sizes, radii, motion) and the element resets. Nothing else goes there.
- Each component imports its own stylesheet (`import './Detail.css'`). Shared primitives (`.btn`, `.input`, `.kbd`, `.tag`, `.count`, `.sheet`, ...) live in `components/ui.css`.
- Class names are BEM: `block`, `block__element`, `block--modifier`. Express state with a modifier class (`card--dragging`, `column--over`) or an ARIA attribute (`[aria-selected='true']`), not a data attribute.
- Keep selectors flat: one class, plus at most a pseudo-class or a `block--modifier .block__element` pair. No IDs. No tag selectors outside the resets.
- Use `var(--token)` for every color, space, size, radius, font, and duration. Add a token before repeating a literal.
- Documented exceptions:
  - `.md` styles tag descendants (`.md a`, `.md pre`) because `marked` output has no classes.
  - Icons are sized and tinted through `--icon-size`, `--icon-color`, and `--icon-scale`, which a global `.lucide` rule reads. Set those on the parent element. Do not style `svg` directly.
  - An element may carry a shared block and its parent's element class together (a "mix"), for example `class="count group__count"`.

## Bun

- Bun is the runtime, package manager, bundler, and test runner. Do not add npm, yarn, Vite, Jest, or Vitest.
