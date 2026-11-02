// Puts the app store back to a fresh, loaded state between tests (the store is a module singleton).

import { DEFAULT_STATES, EMPTY_FILTER, type State, type Todo } from '../../src/model'
import {
  collapsed,
  composer,
  detailOpen,
  filter,
  lastDeleted,
  loaded,
  loadError,
  menuOpen,
  saveError,
  selectedId,
  sheet,
  sort,
  states,
  todos,
  view
} from '../../src/store'

export function resetStore(seed: { todos?: Todo[]; states?: State[] } = {}): void {
  todos.value = seed.todos ?? []
  states.value = seed.states ?? DEFAULT_STATES
  loaded.value = true
  loadError.value = null
  saveError.value = null
  selectedId.value = null
  detailOpen.value = false
  composer.value = null
  sheet.value = null
  menuOpen.value = false
  lastDeleted.value = null
  filter.value = EMPTY_FILTER
  sort.value = 'manual'
  view.value = 'list'
  collapsed.value = new Set()
}
