---
name: "git-workflow"
description: "Branching, commit message conventions, PR practices, and .gitignore hygiene for this workflow."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Git workflow for the Orca plugin

Use this workflow for changes to this Orca plugin, its TypeScript and Preact 11 code, and its Bun-based project files.

## Branches and commits

- Create a branch for the task. Start its name with `feature/`, `fix/`, or `chore/`, followed by a short description, such as `feature/todo-filters` or `fix/sidebar-layout`.
- Use Conventional Commits in the form `type(scope): description`. Keep the description short and specific. For example: `fix(sidebar): preserve selected todo`.
- Keep each commit small and atomic. Include only changes for the current task; leave unrelated work out.
- Ask before including scratch or planning files made only for notes, research, or local use, such as `.md` or `.html` files. Do not commit them without confirmation.
- Do not push to a remote unless the user explicitly confirms the push.
- Keep commit messages focused on the project change. Do not add attribution or co-authorship trailers.

## Pull requests

- Open a focused PR from the task branch. Describe the change to the Orca plugin and its user-visible behavior, and mention any relevant implementation detail in the TypeScript, Preact UI, or Bun project files.
- Keep the PR limited to the task. Do not include scratch or planning files unless the user confirmed their inclusion.
- Keep the title and description focused on the project change. Do not add attribution or co-authorship trailers.

## `.gitignore`

Keep the project `.gitignore` current. Ignore `node_modules/`, `release/` (the `bun run pack` output), local Orca data (`.orca/`), review screenshots, and OS or editor files (`.DS_Store`, `.vscode/`, `.idea/`, swap files). Keep `dist/` tracked: Orca loads it as-is from a development folder, and plugin frames have no network to build it. Rebuild and commit `dist/` together with the source change that affects it. Keep source, `package.json`, and `bun.lock` tracked. Use narrow patterns so ignore rules do not hide source or configuration.

## Hook checks

`lefthook` runs at pre-push only: `gitleaks` secret scan, `bun run test`, `bunx eslint .`, and `bunx prettier --check .`. A failed check blocks the push. Run `lefthook install` once per clone to wire it up. Do not run these checks manually before committing or pushing. Let the hook report failures; fix each reported issue and retry the blocked operation. Pushing still requires explicit user confirmation.
