---
name: "testing"
description: "Test setup, what to test, and naming/organization conventions for the chosen runners and types."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Testing

Use Bun's built-in `bun:test` for unit and integration tests. Import `test`, `expect`, and any other test functions from `bun:test`.

## Setup and layout

Keep test configuration and files separate from the plugin source:

```text
bunfig.toml                 [test] root = "./tests", preload = ["./tests/setup.ts"]
tests/
  setup.ts                  registers happy-dom, installs the fake Orca frame, quiets the logger
  factories/
    orca-frame.ts           createFakeOrcaFrame(): in-memory window.orca (failNext, writeFromElsewhere)
    todo.ts                 makeTodo(overrides)
    store.ts                resetStore({ todos, states }): fresh, loaded store between tests
  fixtures/
    stored-records.ts       raw stored values: valid, legacy, invalid
  unit/                     model, store, keys, log, orca, ui
  integration/              storage-sync (store + fake frame), app (rendered App)
```

Keep `setup.ts` small: put data builders in factories and static inputs in fixtures. Run everything with `bun test`, or one type with `bun run test:unit` / `bun run test:integration`.

The store is a module singleton. Call `fakeOrca.reset()` and `resetStore()` in `beforeEach`. When a test expects a logged warning or error, spy on the matching `console` method with `spyOn(...).mockImplementation(() => {})` and restore it. Render components with Preact's `render` into an element in `document.body`, and wrap updates in `act` from `preact/test-utils`.

Name files after the source module or Preact component they cover, followed by `.test.ts` or `.test.tsx`. Keep each test beside its type directory, for example `tests/unit/store.test.ts` and `tests/integration/app.test.tsx`. Store test-only helpers under `tests/`, not in plugin source folders.

## Unit tests

Test one function, module, or Preact component behavior at a time. Cover plugin-specific input handling, state changes, formatting, and boundary cases. For Preact components, check the user-visible output and event behavior. Use the fake Orca frame from `tests/setup.ts` so no test needs a running Orca.

## Integration tests

Test how plugin parts work together at their boundaries. Cover plugin startup and the flow from an Orca-provided input or event through plugin logic to its resulting action or output. Use the fake frame's `failNext(op)` to test storage failures and `writeFromElsewhere(key, value)` to test sync from the other surface. Mock nothing inside `src/`. Keep integration tests independent of external Orca app state so `bun test` can run them repeatably.

Give tests names that state the behavior and condition, such as `"reports a failure and loads on retry"` or `"shows an empty state when there are no todos"`. Keep each test focused on one outcome and avoid order-dependent shared state.
