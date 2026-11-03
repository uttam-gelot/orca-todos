# Project Guide

## Project Overview

Personal to-do plugin for Orca, the agent-orchestrator IDE: a center tab (list or board) and a right-sidebar panel over the same to-dos, kept in Orca plugin storage. This file is the only agent instruction file in the repo (there is no CLAUDE.md).

## Tech Stack

- Project type: frontend
- Language: TypeScript 6 (strict)
- Runtime, package manager, bundler, test runner: Bun
- Framework: Preact 11
- State: @preact/signals
- Styling: vanilla CSS, BEM, per-component stylesheets

## Folder Structure

```text
orca-plugin.json, panel.html, board.html   plugin manifest and the two surfaces
src/main.tsx      entry: styles.css, <App />, load()
src/App.tsx/.css  shell, empty and error states, toasts
src/components/   one .tsx + its own .css each; ui.tsx/.css hold shared primitives
src/model.ts      types, pure rules, parseTodo/parseStates
src/store.ts      signals, actions, persistence, cross-surface sync
src/orca.ts       the only window.orca access (localStorage fallback for previews)
src/keys.ts       keyboard map; src/focus.ts shared focus requests
src/log.ts        logger; src/errors.ts typed errors
src/styles.css    global tokens and resets only
tests/            setup.ts, factories/, fixtures/, unit/, integration/
scripts/shots/    `bun run shots`: Orca screenshots of a demo copy with sample data
dist/             committed build output that Orca loads
```

## Coding Standards

- DRY
- modular
- soc
- Validate stored data with `parseTodo` / `parseStates` before use; never trust a cast.
- UI calls store actions; only `src/orca.ts` touches `window.orca`.

## Documentation

- Maintain a README covering project purpose, setup, and common commands/scripts.
- Document public APIs with doc-comments (JSDoc/TSDoc, docstrings); explain intent (why), not the obvious (what).

## AI Writing Conventions

- Do not mention AI assistants or add AI co-authorship trailers in commits or PRs.

## Error Handling & Logging

- Use a consistent error strategy: typed/wrapped errors, fail fast, never swallow exceptions.
- Log only through `src/log.ts` (`log.debug|info|warn|error`); ESLint `no-console` enforces it. No logging library.
- Storage failures are `StorageError`s: a failed load sets `loadError`, a failed write sets `saveError`; both show in the UI.
- Never log user content (titles, notes, tags); log ids and keys.

## Testing

- Test types: unit, integration.
- Keep a separate testing setup: dedicated test config and directory layout; use fixtures/factories.
- Use `bun:test` with happy-dom and the fake Orca frame from `tests/setup.ts`. Run `bun test`, `bun run test:unit`, or `bun run test:integration`.

## Tooling

- Formatter: Prettier (`.prettierrc`), `bun run format`
- Linter: ESLint flat config (`eslint.config.js`), `bun run lint`
- Types: `bun run typecheck` (not in the hook; run it after type changes)
- Running these while editing is fine; just do not re-run the hook's checks as a gate before a push.

## Git Workflow

Follow the standard workflow.

- Maintain the .gitignore (dependencies, `release/`, local Orca data, OS/editor files). Keep `dist/` tracked: Orca loads it as-is.
- Name branches using type-prefixed branches (feature/…, fix/…, chore/…).
- Write commit messages using Conventional Commits (type(scope): description).
- Scope each commit to the current task; do not include unrelated changes.
- Ask before committing scratch/planning files (e.g. .md or .html notes for planning, R&D, or local-only use); keep them out of commits unless confirmed.
- Never push to a remote without explicit confirmation.
- Git hooks: `lefthook` runs a secret scan, the tests, the linter, and a format check at pre-push, and blocks the push when a check fails. Run `lefthook install` once per clone.
- Do not run those checks yourself first — the hook runs them. If it blocks, fix the failure and retry.
- Keep commits small and atomic — one logical change per commit.

## Styling — Vanilla CSS

- Define design tokens once as CSS custom properties on `:root` (colors, spacing, typography) and reference `var(--token)` everywhere — never duplicate literal values.
- Name classes with BEM (`block__element--modifier`) to keep specificity flat; avoid deep descendant selectors and ID selectors.
- Keep selector specificity low and flat; prefer class selectors over nesting tags or IDs.
- Co-locate component styles with their component and load a single global entry for resets/tokens.
- Exceptions: `.md` styles tag descendants (marked output has no classes); icons are sized/tinted via `--icon-size`, `--icon-color`, `--icon-scale` read by a global `.lucide` rule; mixes like `class="count group__count"` are allowed.

## Tech Details

- Vanilla CSS / Methodology: BEM naming
- TypeScript Config / Version: 6.0 (typescript-eslint does not support 7 yet)
- TypeScript Config / Strict mode: yes
- TypeScript Config / Compile target: ES2022
- TypeScript Config / Module resolution: Bundler
- TypeScript Config / Path aliases: no

## Skills

Before writing or changing code in this project, consult the skills below and follow the ones that apply. Each skill file states when it applies; load it and obey its rules for any matching work.

- **Project Overview** — `.agents/skills/project-overview/SKILL.md`: This project's purpose, scope, and high-level architecture, and how its stack fits together.
- **Coding Standards** — `.agents/skills/coding-standards/SKILL.md`: Naming, file organization, validation, and CSS conventions for this codebase.
- **Framework Conventions** — `.agents/skills/framework-conventions/SKILL.md`: Idiomatic patterns, project structure, and common pitfalls for the chosen framework.
- **Error Handling & Logging** — `.agents/skills/error-handling-logging/SKILL.md`: Consistent error strategy and structured logging conventions with appropriate levels.
- **Testing** — `.agents/skills/testing/SKILL.md`: Test setup, what to test, and naming/organization conventions for the chosen runners and types.
- **Tooling** — `.agents/skills/tooling/SKILL.md`: Respecting the selected formatter, linter, package manager, and runtime, and keeping code passing them.
- **Documentation** — `.agents/skills/documentation/SKILL.md`: What each selected documentation artifact should contain and how to keep it current.
- **Git Workflow** — `.agents/skills/git-workflow/SKILL.md`: Branching, commit message conventions, PR practices, and .gitignore hygiene for this workflow.
- **Change Audit** — `.agents/skills/change-audit/SKILL.md`: Use right before pushing to a remote to check the pending change against this project's skills and report any that conflict.
