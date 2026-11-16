// Focus hand-offs between the keyboard layer and the components that own the fields. Kept apart
// from both so `keys.ts` does not import UI modules (and can be tested without rendering them).

/** Set by the keyboard layer: which detail field to focus when the detail pane renders. */
export const focusRequest = { field: null as null | 'title' | 'description' }

import { signal } from '@preact/signals'

/** The search input, registered by the header so `/` can focus it. */
export const searchRef = { current: null as HTMLInputElement | null }

/** In a narrow pane the search folds into an icon; this opens it. Wide panes always show it. */
export const searchOpen = signal(false)

/** Shows the search field (unfolding it in a narrow pane) and focuses it. */
export function focusSearch(): void {
  searchOpen.value = true
  // The field renders on the next frame when it was folded.
  requestAnimationFrame(() => searchRef.current?.focus())
}
