---
name: "error-handling-logging"
description: "Consistent error strategy and structured logging conventions with appropriate levels."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Error handling and logging

These conventions apply to the TypeScript and Preact 11 code of this Orca plugin. Keep failures visible to the plugin's callers and users, and make diagnostics useful without exposing sensitive data.

## Errors

- Fail fast when an operation cannot safely continue. Do not catch an error just to ignore it, return a success-shaped fallback, or leave the plugin in a misleading state.
- Use typed errors for expected failure categories. When adding context at a boundary, wrap the original error and preserve its cause; do not replace useful error details with a generic message.
- Catch errors only where the code can take a concrete action: add context, recover safely, report a user-facing failure, or hand the failure to the caller. Otherwise let the error propagate.
- Surface errors through the calling function's rejected promise or thrown error. At UI boundaries, show a concise, actionable message and retain diagnostic details for the centralized logger. Do not expose stack traces or internal details in the interface.
- Validate inputs and external results before using them. On invalid or incomplete data, raise a typed error with safe context instead of proceeding with invalid state.

In this project the expected failure is storage. `src/errors.ts` defines `StorageError` with an `op` (`load`, `read`, `write`, `delete`), the `key`, and the original `cause`. Add a new class there for a new failure category.

```ts
try {
  // read every key ...
} catch (cause) {
  const error = new StorageError('load', undefined, { cause })
  log.error('Could not load to-dos', { op: 'load' }, error)
  loadError.value = error // App shows "Could not load your to-dos" with Try again
}
```

- A failed load sets `loadError`. A failed write sets `saveError` (through `persist()` in `store.ts`). Both are shown in the UI. Neither is swallowed.
- A failed preference read or write falls back to defaults with a `log.warn`: preferences are a convenience, not user data.

## Centralized structured logging

- Use `src/log.ts`: `log.debug|info|warn|error(message, context?, error?)`. It is the only place that calls `console` (ESLint `no-console` enforces this). Do not add a logging library. `logConfig.level` sets the minimum level (`info` by default; tests set `error`).
- Provide `debug`, `info`, `warn`, and `error` levels. Use `debug` for development diagnostics, `info` for notable plugin lifecycle events, `warn` when the plugin can continue after an unexpected condition, and `error` when an operation fails or needs attention.
- Pass context as an object with safe fields: `op`, `key`, counts. Every line gets the `[orca-todos]` prefix so it is easy to find in Orca's devtools.
- Log an error once at the boundary that handles or reports it. Include the error and its cause where supported; avoid logging the same propagated error at every layer.
- Do not log user content: to-do titles, notes, or tags. Log ids and keys instead.
- Keep messages concise and descriptive. Do not use logs as a substitute for propagating errors or showing the user a relevant failure.
