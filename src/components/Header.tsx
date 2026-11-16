// Main pane header: scope title, view switch, search, and the display menu.

import { useEffect, useRef } from 'preact/hooks'
import {
  Archive,
  CalendarClock,
  Columns3,
  Hash,
  Inbox,
  Keyboard,
  List,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  X
} from 'lucide-preact'
import { t } from '../i18n/t'
import { EMPTY_FILTER, PRIORITIES, type DueFilter, type Priority, type Sort } from '../model'
import {
  archiveClosed,
  filter,
  menuOpen,
  openComposer,
  overdueCount,
  scope,
  sheet,
  sort,
  stateById,
  summary,
  view,
  visible
} from '../store'
import { focusSearch, searchOpen, searchRef } from '../focus'
import { ScopeSelect } from './Rail'
import { IconButton, Kbd, PriorityIcon, StateIcon } from './ui'
import './Header.css'

function ScopeTitle() {
  const s = scope.value
  const state = s.kind === 'state' ? stateById.value.get(s.id) : undefined
  const [icon, name] =
    s.kind === 'state'
      ? [<StateIcon state={state} />, state?.name ?? t.state]
      : s.kind === 'tag'
        ? [<Hash />, s.id]
        : s.kind === 'archived'
          ? [<Archive />, t.archived]
          : [<Inbox />, t.allTodos]
  return (
    <h1 class="scope-title">
      {icon}
      <span class="scope-title__name">{name}</span>
      <span class="scope-title__count count">{visible.value.length}</span>
    </h1>
  )
}

/**
 * "2 high": the open high-priority to-dos in view, as a toggle for the priority filter. It answers
 * "what needs attention now", which the totals do not.
 */
function HighCount() {
  const on = filter.value.priority === 'high'
  const count = visible.value.filter((t) => t.priority === 'high' && !stateById.value.get(t.stateId)?.closed).length
  if (!count && !on) return null
  return (
    <button
      type="button"
      class="btn btn--ghost btn--xs header__high"
      aria-pressed={on}
      title={on ? t.showEveryPriority : t.showOnlyHigh}
      onClick={() => (filter.value = { ...filter.value, priority: on ? '' : 'high' })}
    >
      <PriorityIcon priority="high" />
      {count}
      <span class="header__high-label">{t.highWord}</span>
    </button>
  )
}

/** "1 overdue": open to-dos past their due, as a toggle for the due filter. Shown only when any are. */
function OverdueCount() {
  const on = filter.value.due === 'overdue'
  const count = overdueCount.value
  if (!count && !on) return null
  return (
    <button
      type="button"
      class="btn btn--ghost btn--xs header__overdue"
      aria-pressed={on}
      title={on ? t.showEveryDue : t.showOnlyOverdue}
      onClick={() => (filter.value = { ...filter.value, due: on ? '' : 'overdue' })}
    >
      <CalendarClock />
      {count}
      <span class="header__high-label">{t.overdueWord}</span>
    </button>
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
        <HighCount />
        <OverdueCount />
        <span class="spacer" />
        <div class="seg" role="group" aria-label={t.view}>
          <button
            type="button"
            class="seg__btn"
            aria-pressed={view.value === 'list'}
            title={`${t.list} (V)`}
            onClick={() => (view.value = 'list')}
          >
            <List />
            <span class="seg__label">{t.list}</span>
          </button>
          <button
            type="button"
            class="seg__btn"
            aria-pressed={view.value === 'board'}
            title={`${t.board} (V)`}
            onClick={() => (view.value = 'board')}
          >
            <Columns3 />
            <span class="seg__label">{t.board}</span>
          </button>
        </div>
        {searchFolded() && (
          <IconButton label={`${t.search} (/)`} class="header__search" onClick={focusSearch}>
            <Search />
          </IconButton>
        )}
        <DisplayMenu />
        <button
          type="button"
          class="btn btn--primary btn--sm header__new"
          title={`${t.newTodo} (N)`}
          onClick={() => openComposer()}
        >
          <Plus />
          <span class="header__new-label">{t.new}</span>
        </button>
      </div>
      <SearchBox />
    </header>
  )
}

/** True while the search is folded into the header icon: closed and empty. Only narrow panes fold. */
const searchFolded = () => !searchOpen.value && !filter.value.text

function SearchBox() {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    searchRef.current = ref.current
  }, [])
  const text = filter.value.text
  return (
    <div class={searchFolded() ? 'search search--folded' : 'search'}>
      <Search class="search__icon" />
      <input
        ref={ref}
        class="search__input"
        type="search"
        aria-label={t.searchTodos}
        placeholder={t.searchPlaceholder}
        value={text}
        onInput={(e) => (filter.value = { ...filter.value, text: e.currentTarget.value })}
        onBlur={() => (searchOpen.value = false)}
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
          label={t.clearSearch}
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
  const changed =
    filter.value.priority !== EMPTY_FILTER.priority || filter.value.due !== EMPTY_FILTER.due || sort.value !== 'manual'
  const reset = () => {
    filter.value = { ...filter.value, priority: EMPTY_FILTER.priority, due: EMPTY_FILTER.due }
    sort.value = 'manual'
  }
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
        label={changed ? t.displayOptionsOn : t.displayOptions}
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
            <span>{t.priority}</span>
            <select
              class="select menu__select"
              value={filter.value.priority}
              onChange={(e) => (filter.value = { ...filter.value, priority: e.currentTarget.value as Priority | '' })}
            >
              <option value="">{t.anyPriority}</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t.priorities[p]}
                </option>
              ))}
            </select>
          </label>
          <label class="menu__field">
            <span>{t.dueFilter}</span>
            <select
              class="select menu__select"
              value={filter.value.due}
              onChange={(e) => (filter.value = { ...filter.value, due: e.currentTarget.value as DueFilter })}
            >
              <option value="">{t.dueAny}</option>
              <option value="overdue">{t.dueOverdue}</option>
              <option value="today">{t.dueByToday}</option>
              <option value="week">{t.dueWeek}</option>
            </select>
          </label>
          <label class="menu__field">
            <span>{t.order}</span>
            <select
              class="select menu__select"
              value={sort.value}
              onChange={(e) => (sort.value = e.currentTarget.value as Sort)}
            >
              <option value="manual">{t.orderManual}</option>
              <option value="priority">{t.orderPriority}</option>
              <option value="due">{t.orderDue}</option>
              <option value="updated">{t.orderUpdated}</option>
              <option value="created">{t.orderCreated}</option>
            </select>
          </label>
          {changed && (
            <button type="button" class="menu__item" onClick={pick(reset)}>
              <RotateCcw />
              {t.resetDisplay}
            </button>
          )}
          <div class="menu__sep" />
          <button type="button" class="menu__item" disabled={!closedCount} onClick={pick(archiveClosed)}>
            <Archive />
            {t.archiveClosed}
            <span class="menu__meta count">{closedCount || ''}</span>
          </button>
          <button type="button" class="menu__item" onClick={pick(() => (sheet.value = 'states'))}>
            <Settings2 />
            {t.editStates}
          </button>
          <button type="button" class="menu__item" onClick={pick(() => (sheet.value = 'shortcuts'))}>
            <Keyboard />
            {t.keyboardShortcuts}
            <Kbd class="menu__kbd">?</Kbd>
          </button>
        </div>
      )}
    </div>
  )
}
