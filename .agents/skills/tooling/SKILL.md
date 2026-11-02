---
name: "tooling"
description: "Respecting the selected formatter, linter, package manager, and runtime, and keeping code passing them."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Tooling for Orca ToDos

Keep the TypeScript and Preact 11 code for this Orca plugin consistent with the repository's Prettier and ESLint choices, Bun package manager, and Bun runtime.

## Formatting and linting

- Use Prettier for formatting and ESLint for linting. Preserve the repository's configuration and existing style; do not add or substitute another formatter or linter.
- Config: `eslint.config.js` (flat config: `@eslint/js`, `typescript-eslint` recommended, `eslint-config-prettier`, `no-console: error`) and `.prettierrc` (no semicolons, single quotes, no trailing commas, 120 columns). `.prettierignore` skips build output and generated agent files.
- Scripts: `bun run format`, `bun run lint`, `bun run typecheck`, `bun test`. Running them while you edit is fine and fast. The pre-push hook runs the same checks, so do not run the whole set again only as a gate before a commit or push (see the git-workflow skill).
- `bun run typecheck` is not in the hook. Run it after changing types or signatures.
- Fix reported issues in the code or its formatting. Do not suppress ESLint rules or change shared configuration just to hide a finding; make a narrow, justified configuration change only when the Orca plugin's TypeScript or Preact code needs it.

## Bun package management and runtime

- Use Bun to install dependencies and run project scripts. Keep `bun.lock` committed and update it with dependency changes; do not replace it with a lockfile from another package manager.
- Use Bun as the runtime for the plugin's TypeScript project and its scripts. Do not introduce runtime-specific assumptions from an unlisted runtime; keep browser-facing Preact code compatible with its browser build.
- Keep dependency changes limited to what the plugin needs. Keep TypeScript on 6.x until typescript-eslint supports 7. When adding or changing dependencies, update `package.json` and `bun.lock` together.
