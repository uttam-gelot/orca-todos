---
name: "documentation"
description: "What each selected documentation artifact should contain and how to keep it current."
metadata:
  generator: payo
  payo-version: "2.5.0"
---

# Documentation conventions

Keep the README useful to someone installing or developing this Orca plugin. Keep code comments beside the TypeScript or Preact code they explain. Update either artifact in the same change that makes its guidance inaccurate.

## README.md

- State that this project adds personal to-dos to Orca. Describe the main tab and sidebar, and explain that both use the same stored data.
- Include setup for Bun and the Orca development-folder workflow. Explain how to create a release copy with `bun run pack` when installation instructions change.
- Keep common commands aligned with the `scripts` in `package.json`. Document `bun install`, `build`, `watch`, `typecheck`, `lint`, `format`, `test` (and `test:unit` / `test:integration`), and `pack` with a short purpose for each.
- Update feature and keyboard summaries when the Preact interface or plugin behavior changes. Keep `DESIGN.md` (visual rules) and `PRODUCT.md` (users and purpose) current when a change affects them. Keep the README's Orca requirements and storage details in sync with the plugin configuration and implementation.

## TypeScript and Preact comments

- Use JSDoc/TSDoc comments for exported APIs, public component props, and non-obvious contracts. Explain why the API exists or what callers must rely on, not what its statements already show.
- Add comments near Orca integration code when a capability, storage choice, or tab/sidebar behavior has a constraint that is not clear from the code.
- Do not add comments to routine code or duplicate README content. When behavior or a public contract changes, update its nearby comment in the same change. Remove comments that no longer match the implementation.
