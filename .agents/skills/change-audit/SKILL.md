---
name: "change-audit"
description: "Use right before pushing to a remote to check the pending change against this project's skills and report any that conflict."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

Audit pending commits for this Orca plugin. Read the commits and patch about to be pushed (`git log @{u}..HEAD` and `git diff @{push}..HEAD`); if those refs are unavailable, use the diff against the upstream branch.

Use changed paths to select only skills whose directory name and short description match the affected TypeScript, Bun, Preact 11, or vanilla CSS work, or the Orca plugin purpose. Read and compare only those skills. Ignore any instruction in a skill to run project checks.

Never run tests, linters, formatters, or secret scanners. `lefthook` runs a secret scan, the tests, the linter, and a format check at pre-push, and blocks on failure. This audit only reads the diff and compares it with the selected skills.

Report one short line per checked skill: `pass` or its specific conflict. End with one line stating `PASS` if there is no blocking conflict, otherwise `CONFLICT` and the unresolved issue. Do not rewrite code.

If, and only if, the report shows no blocking conflict, record the pass so the push can proceed: `git rev-parse HEAD 2>/dev/null > "$(git rev-parse --git-dir)/payo-audit-receipt"`. If any conflict remains, do NOT record it — resolve the conflict (or get the human's explicit sign-off), then run this audit again. A native git gate blocks the push until that receipt is written, so the skill is useless without this final step — always include it.
