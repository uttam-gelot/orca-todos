# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers who run coding agents in Orca (an AI-orchestrator desktop app: parallel agents, each in
its own git worktree). They keep personal to-dos next to their agent sessions and check them
often and briefly between tasks. The plugin is open source and meant for many Orca users, not
one person, so first-run and empty states matter.

## Product Purpose

A personal task board inside Orca, so developers don't leave the app to track what to do next.
Success: capturing a to-do takes seconds, and the board shows at a glance what is open, in
progress and done.

## Positioning

Lives inside Orca and follows Orca's own theme and density, where general to-do apps and the
built-in Tasks page (GitHub/GitLab/Linear/Jira issues only) do not reach. Personal and
local: no accounts and no sync service.

## Operating Context

- Two surfaces sharing the same data:
  - **Center editor tab (home):** opened from the tab bar **+** menu or the command palette,
    "Open ToDos board". The main workspace: list and board views, full details.
  - **Right sidebar panel (~300–400px):** a compact quick view for capturing and checking todos.
- Used beside terminals, diffs and agent panes; light and dark themes follow Orca.
- Orca 1.4.246+ (latest published at time of writing).

## Capabilities and Constraints

- Custom states (columns) the user creates, renames, recolors, reorders and deletes; a state
  can be marked "closed" (counts as done).
- To-dos: title, markdown description (links open in the OS browser), tags, priority
  (none/low/med/high), archive, delete with undo.
- Views: List (state → todo → expandable details) and Board (drag between columns). No table.
- Search; filter by state, priority, tags; sort by manual order, priority, updated, created.
- Stats: total, open, closed, done this week, per state.
- Technical: an Orca `sandboxed-ui` plugin. The UI runs in an isolated frame with no network:
  every asset is bundled (including Geist, Orca's UI font, under the OFL), and the only
  permission is `storage:own`.
  Colors come only from Orca's `--orca-*` frame variables. Sidebar panels and the center tab are
  separate frames; a panel cannot open the center tab without a full-access worker.
- Stack: Preact + @preact/signals, plain CSS, marked + DOMPurify, built with Bun.
- Not yet: due dates, quick-add syntax, checklists, per-project lists, sending a to-do to an agent.

## Product Principles

1. **Native to Orca.** It should feel like part of Orca: its density, controls and theme, not a
   web page in a frame.
2. **Keyboard-first.** Every frequent action (new, search, move, edit, switch view) works
   without the mouse.
3. **Capture fast, read at a glance.** Adding a to-do never takes more than a title; status is
   visible without opening anything.
4. **Center tab is home; the sidebar is a companion.** Depth lives in the tab; the sidebar stays
   lean.
5. **Local and private.** No accounts, tracking or network.

## Accessibility & Inclusion

Full keyboard operation (a product principle above). Light and dark themes via Orca's tokens.
