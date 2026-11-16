# Design

The visual authority is Orca itself. This plugin should read as one more Orca pane, not a web page
in a frame.

## World

- **Tokens:** every color, space, size, radius and duration is a custom property in
  `src/styles.css`. Each component has its own BEM stylesheet next to it.
- **Colors:** only Orca's `--orca-*` frame variables, mapped in `src/styles.css`. The fallbacks
  exist only for browser previews.
- **Color carries state, nothing else.** Each state's color appears on its circle icon, the rail
  and the progress bar. An agent run's state is a dot in its own fixed colors (`--run-*`: blue
  working, amber needs you, green finished, gray otherwise). Only "Needs you" also colors its text,
  mixed toward the foreground for contrast. High priority is the one priority with a color
  (`--prio-high`, red-orange mixed toward the foreground); medium is the foreground and low is
  muted. Everything else is monochrome.
- **Type:** Geist (bundled, OFL) at 13px for rows and items, 12px for secondary text, 14px semibold
  for titles, and 18px semibold for the detail title. Section labels are 11px uppercase semibold
  with 0.05em tracking. Numbers use tabular figures.
- **Icons:** Lucide at 16px (14px inside 24px buttons). No unicode glyphs or emoji as icons.
- **Controls:** shadcn sizes, as Orca uses them.
  - Buttons: `btn` 36px, `btn-sm` 32px, `btn-xs` 24px. Icon buttons are 32px or 24px.
  - Inputs and selects: 28px, 12px text.
  - Primary is only for **New** and for the one submit action of a dialog (**Start agent**). Ghost
    is for icon buttons. Outline is for secondary actions.
  - Destructive appears only for confirming a state delete.
- **Elevation:**
  - Panes and cards use hairline borders. Cards and primary buttons also get `shadow-xs`.
  - `--shadow-floating` is only for the popover menu, sheets and the toast.
- **Motion:** 150ms for hovers and popovers, 200–250ms for sheets, panes and the progress bar. All
  motion only shows a change of state. `prefers-reduced-motion` turns it off.

## Layout

- **1040px and wider:** three panes. Rail (220px), main (list or board), detail (400px, only while
  a to-do is open).
- **760–1039px:** rail and main. Details open as a right sheet.
- **Below 760px (the sidebar):** the rail becomes a scope `<select>` with counts, the stats become a
  28px status bar, and details open as a full-width sheet. Below 520px, the view and New buttons
  show icons only. Below 420px, row tags hide.

## Patterns

- **Rows:** 34px.
  - Hover is a 60% accent tint; selected is full accent.
  - Columns: priority, state toggle, title, notes marker, tags, age.
- **Header:** "N high" (open high-priority to-dos in view) toggles the priority filter. The display
  options icon gets a dot while a filter or order is on, and the menu offers a reset.
- **Columns:** flex from 260px to 360px, so a wide tab fills; more states scroll sideways. Each
  column has a 2px top edge in its state color.
- **Cards:** the selected card gets a ring. The drop target shows a 2px ring-colored line above the
  card.
- **Composer:** inline, at the end of the target group or column. Enter adds and keeps it open; Esc
  closes it.
  `#tag` and `!high` words in the title set tags and the priority; the placeholder says so.
- **Editing in place:**
  - Title: Enter or blur saves; Esc reverts.
  - Tags: Enter or comma adds; Backspace removes the last one.
  - Notes: the markdown preview has an edit control. The editor saves as you type, and ⌘↵ or Esc
    finishes.
- **Overlays:** sheets for edge panels (details when narrow, states, shortcuts). A popover holds the
  display options. The one centered dialog is **Start agent**, laid out like Orca's New Workspace
  composer. Sheets and the dialog are modal: `aria-modal`, Tab stays inside, Esc or the scrim
  closes them, and focus returns.
- **Agents:**
  - Rows and cards: a ghost **Agent →** (on hover or selection in rows) opens the dialog. Once a
    run exists it becomes an outline **Open →** with the run's dot and label next to it. Below
    420px, rows show the dot alone.
  - The dialog: workspace (grouped by project), agent, then the prompt as a read-only preview with
    **Edit**. An edited prompt is kept per to-do until it starts. The footer names the side
    effects ("New terminal · moves to In Progress"). Without the worker, Copy prompt is the
    primary action.
- **Empty states teach:** they name the key to press (N, ↵, 1–9, A) and offer a single action.
- **Keyboard:** see `src/keys.ts` and the shortcut sheet (`?`). Esc backs out one layer at a time:
  sheet → menu → composer → details → selection → search.
