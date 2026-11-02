# Design

The visual authority is Orca itself. This plugin should read as one more Orca pane, not a web page
in a frame.

## World

- **Tokens:** every color, space, size, radius and duration is a custom property in
  `src/styles.css`. Each component has its own BEM stylesheet next to it.
- **Colors:** only Orca's `--orca-*` frame variables, mapped in `src/styles.css`. The fallbacks
  exist only for browser previews.
- **Color carries state, nothing else.** Each state's color appears on its circle icon, the rail
  and the progress bar. Everything else is monochrome. High priority is the foreground color, not
  red.
- **Type:** Geist (bundled, OFL) at 13px for rows and items, 12px for secondary text, 14px semibold
  for titles, and 18px semibold for the detail title. Section labels are 11px uppercase semibold
  with 0.05em tracking. Numbers use tabular figures.
- **Icons:** Lucide at 16px (14px inside 24px buttons). No unicode glyphs or emoji as icons.
- **Controls:** shadcn sizes, as Orca uses them.
  - Buttons: `btn` 36px, `btn-sm` 32px, `btn-xs` 24px. Icon buttons are 32px or 24px.
  - Inputs and selects: 28px, 12px text.
  - Primary is only for **New**. Ghost is for icon buttons. Outline is for secondary actions.
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
- **Cards:** the selected card gets a ring. The drop target shows a 2px ring-colored line above the
  card.
- **Composer:** inline, at the end of the target group or column. Enter adds and keeps it open; Esc
  closes it.
- **Editing in place:**
  - Title: Enter or blur saves; Esc reverts.
  - Tags: Enter or comma adds; Backspace removes the last one.
  - Notes: the markdown preview has an edit control. The editor saves as you type, and ⌘↵ or Esc
    finishes.
- **Overlays:** sheets for edge panels (details when narrow, states, shortcuts). A popover holds the
  display options. There are no blocking dialogs.
- **Empty states teach:** they name the key to press (N, ↵, 1–9, A) and offer a single action.
- **Keyboard:** see `src/keys.ts` and the shortcut sheet (`?`). Esc backs out one layer at a time:
  sheet → menu → composer → details → selection → search.
