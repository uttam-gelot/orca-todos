---
name: "framework-conventions"
description: "Idiomatic patterns, project structure, and common pitfalls for the chosen framework."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Preact 11 conventions for the Orca to-dos plugin

## Project structure

- Keep the Orca plugin UI in `src/`: `App.tsx` composes the interface, `components/` contains focused Preact function components, and `store.ts`, `model.ts`, `orca.ts`, `keys.ts`, `focus.ts`, `log.ts`, `errors.ts`, and `markdown.ts` hold state, domain logic, Orca integration, keyboard handling, cross-module focus requests, logging, typed errors, and markdown handling respectively. Put shared domain types in `model.ts` rather than importing types from UI components.
- Keep `main.tsx` as the browser entry: import the global `styles.css`, render `<App />` once into the HTML root with Preact's `render`, and start the initial async load. Keep panel and board HTML entry behavior aligned with the Orca plugin's two surfaces.
- Keep global resets and design tokens in `styles.css`. Put new component-specific CSS beside its component and load it from that component. Use BEM class names, flat class selectors, and `:root` custom properties for reusable values; reference tokens with `var(--token)` instead of repeating literal values. The coding-standards skill lists the few documented exceptions (`.md`, icon custom properties, mixes).
- Do not introduce a router: the project details specify none, and the plugin has panel and board surfaces managed by Orca. Use the existing view and selection state for in-app navigation. Preserve the browser-only `#select=<id>` preview behavior without making it an Orca routing contract.

## Preact component patterns

- Write UI as small function components with typed props. Keep rendering declarative: derive rows, groups, selected detail, and empty states from the store, then render with JSX and stable keys (`key={todo.id}` for to-do lists).
- Use Preact hooks from `preact/hooks`. Call hooks unconditionally at the top level of a component; register DOM listeners, timers, or subscriptions in an effect and return cleanup when the component unmounts or dependencies change.
- Use Preact's configured JSX runtime (`jsxImportSource: "preact"`) and Preact DOM types. Use `class`, not `className`, in JSX. Use native elements and typed event handlers; give interactive controls an accessible name and semantic button or input behavior.
- Keep domain and mutation logic out of render functions. Put reusable to-do operations in `store.ts` or pure rules in `model.ts`; have event handlers call those operations. Avoid mutating arrays, objects, or Sets held in signals in place: assign a new value so dependents update, such as `collapsed.value = new Set(collapsed.value).add(id)`.

## State and data loading

- Use `@preact/signals` for shared UI and plugin state. Read `.value` during component render so Preact subscribes the component; use `computed` for values derived from other signals instead of copying derived data into another signal.
- Keep Orca storage access behind `orca.ts` and coordinate loading and cross-surface updates through `store.ts`. Load persisted records asynchronously, represent the loading and failed states explicitly (`loaded`, `loadError`; `load()` is safe to call again as a retry), and update the relevant signal when a write or Orca change event completes. Do not put storage calls in render or repeat a full load for ordinary UI changes.
- Use Preact local state only for short-lived state owned by one component. Keep state shared by the sidebar and center tab in the store; persist view preferences only through the existing preference flow.
- Handle storage failures according to whether the value is essential: plugin data operations should surface or preserve a recoverable state, while convenience preferences may fall back to defaults. Do not silently present an uncompleted async operation as saved: store writes go through `persist()`, which sets `saveError` so the UI can say so.

## TypeScript and common pitfalls

- Keep TypeScript strict and target ES2022 with Bundler module resolution. Type component props, event boundaries, storage values, and async results; narrow nullable selections before rendering detail content.
- Treat Orca storage contents and browser storage as runtime data: run them through `parseTodo` / `parseStates` in `model.ts` before relying on fields. A TypeScript cast does not validate persisted JSON.
- Avoid unstable or missing keys in mapped components; keys preserve row and editor identity when lists change. Use a changing key only when intentionally resetting component-local state, as with a detail view switching to a different to-do.
- Do not call hooks inside branches, loops, or nested callbacks. Do not install global listeners without cleanup, or capture stale values in long-lived callbacks; use effect dependencies or read the current signal value when handling the event.
- Do not assume the browser preview environment is the Orca host. Keep Orca APIs behind the existing adapter and guard preview-only behavior so missing host APIs do not break local rendering.
