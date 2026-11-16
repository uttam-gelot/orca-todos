// Puts the app store back to a fresh, loaded state between tests (the store is a module singleton).

import { DEFAULT_AGENT } from '../../src/agents'
import { searchOpen } from '../../src/focus'
import { languageSetting } from '../../src/i18n/t'
import { seen } from '../../src/seen'
import { DEFAULT_STATES, EMPTY_FILTER, type State, type Todo } from '../../src/model'
import {
  agentChoice,
  collapsed,
  composer,
  detailOpen,
  filter,
  lastUndoable,
  loaded,
  loadError,
  menuOpen,
  notice,
  saveError,
  selectedId,
  sheet,
  sort,
  states,
  todos,
  view,
  workspaceList
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
  lastUndoable.value = null
  searchOpen.value = false
  seen.value = { since: 0, todos: {} }
  notice.value = null
  filter.value = EMPTY_FILTER
  sort.value = 'manual'
  view.value = 'list'
  collapsed.value = new Set()
  agentChoice.value = { agent: DEFAULT_AGENT, workspaceId: '' }
  workspaceList.value = { status: 'loading' }
  languageSetting.value = 'auto'
}
