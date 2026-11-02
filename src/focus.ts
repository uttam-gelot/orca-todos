// Focus hand-offs between the keyboard layer and the components that own the fields. Kept apart
// from both so `keys.ts` does not import UI modules (and can be tested without rendering them).

/** Set by the keyboard layer: which detail field to focus when the detail pane renders. */
export const focusRequest = { field: null as null | 'title' | 'description' }

/** The search input, registered by the header so `/` can focus it. */
export const searchRef = { current: null as HTMLInputElement | null }
