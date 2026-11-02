// Main pane header: scope title, view switch, search, and the display menu.

import { useEffect, useRef } from 'preact/hooks'
import {
  Archive,
  Columns3,
  Hash,
  Inbox,
  Keyboard,
  List,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  X
} from 'lucide-preact'
import { EMPTY_FILTER, PRIORITIES, type Priority, type Sort } from '../model'
import {
  archiveClosed,
  filter,
  menuOpen,
  openComposer,
  scope,
  sheet,
  sort,
  stateById,
  summary,
  view,
  visible
} from '../store'
import { searchRef } from '../focus'
import { ScopeSelect } from './Rail'
import { IconButton, Kbd, PRIORITY_LABEL, StateIcon } from './ui'
import './Header.css'

function ScopeTitle() {
  const s = scope.value
  const state = s.kind === 'state' ? stateById.value.get(s.id) : undefined
  const [icon, name] =
    s.kind === 'state'
      ? [<StateIcon state={state} />, state?.name ?? 'State']
      : s.kind === 'tag'
        ? [<Hash />, s.id]
        : s.kind === 'archived'
          ? [<Archive />, 'Archived']
          : [<Inbox />, 'All to-dos']
  return (
    <h1 class="scope-title">
      {icon}
      <span class="scope-title__name">{name}</span>
      <span class="scope-title__count count">{visible.value.length}</span>
    </h1>
  )
}

export function Header() {
  return (
    <header class="header">
      <div class="header__row">
        <div class="header__wide-only">
          <ScopeTitle />
        </div>
        <div class="header__narrow-only">
          <ScopeSelect />
        </div>
        <span class="spacer" />
        <div class="seg" role="group" aria-label="View">
          <button
            type="button"
            class="seg__btn"
            aria-pressed={view.value === 'list'}
            title="List (V)"
            onClick={() => (view.value = 'list')}
          >
            <List />
            <span class="seg__label">List</span>
          </button>
          <button
            type="button"
            class="seg__btn"
            aria-pressed={view.value === 'board'}
            title="Board (V)"
            onClick={() => (view.value = 'board')}
          >
            <Columns3 />
            <span class="seg__label">Board</span>
          </button>
        </div>
        <DisplayMenu />
        <button
          type="button"
          class="btn btn--primary btn--sm header__new"
          title="New to-do (N)"
          onClick={() => openComposer()}
        >
          <Plus />
          <span class="header__new-label">New</span>
        </button>
      </div>
      <SearchBox />
    </header>
  )
}

function SearchBox() {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    searchRef.current = ref.current
  }, [])
  const text = filter.value.text
  return (
    <div class="search">
      <Search class="search__icon" />
      <input
        ref={ref}
        class="search__input"
        type="search"
        aria-label="Search to-dos"
        placeholder="Search titles and notes"
        value={text}
        onInput={(e) => (filter.value = { ...filter.value, text: e.currentTarget.value })}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            if (filter.value.text) filter.value = { ...filter.value, text: '' }
            else e.currentTarget.blur()
          }
          if (e.key === 'Enter' || e.key === 'ArrowDown') e.currentTarget.blur()
        }}
      />
      {text ? (
        <IconButton
          label="Clear search"
          class="btn--icon-xs"
          onClick={() => (filter.value = { ...filter.value, text: '' })}
        >
          <X />
        </IconButton>
      ) : (
        <Kbd class="search__kbd">/</Kbd>
      )}
    </div>
  )
}

function DisplayMenu() {
  const ref = useRef<HTMLDivElement>(null)
  const open = menuOpen.value
  const changed = filter.value.priority !== EMPTY_FILTER.priority || sort.value !== 'manual'
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) menuOpen.value = false
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const closedCount = summary.value.closed
  const pick = (fn: () => void) => () => {
    fn()
    menuOpen.value = false
  }
  return (
    <div class="menu" ref={ref}>
      <IconButton
        label="Display options"
        aria-expanded={open}
        aria-haspopup="true"
        class={changed ? 'btn--dot' : ''}
        onClick={() => (menuOpen.value = !open)}
      >
        <SlidersHorizontal />
      </IconButton>
      {open && (
        <div
          class="menu__popover"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              menuOpen.value = false
            }
          }}
        >
          <label class="menu__field">
            <span>Priority</span>
            <select
              class="select menu__select"
              value={filter.value.priority}
              onChange={(e) => (filter.value = { ...filter.value, priority: e.currentTarget.value as Priority | '' })}
            >
              <option value="">Any</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          <label class="menu__field">
            <span>Order</span>
            <select
              class="select menu__select"
              value={sort.value}
              onChange={(e) => (sort.value = e.currentTarget.value as Sort)}
            >
              <option value="manual">Manual</option>
              <option value="priority">Priority</option>
              <option value="updated">Recently updated</option>
              <option value="created">Newest</option>
            </select>
          </label>
          <div class="menu__sep" />
          <button type="button" class="menu__item" disabled={!closedCount} onClick={pick(archiveClosed)}>
            <Archive />
            Archive closed to-dos
            <span class="menu__meta count">{closedCount || ''}</span>
          </button>
          <button type="button" class="menu__item" onClick={pick(() => (sheet.value = 'states'))}>
            <Settings2 />
            Edit states
          </button>
          <button type="button" class="menu__item" onClick={pick(() => (sheet.value = 'shortcuts'))}>
            <Keyboard />
            Keyboard shortcuts
            <Kbd class="menu__kbd">?</Kbd>
          </button>
        </div>
      )}
    </div>
  )
}
