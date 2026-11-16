// Three panes on a wide surface (navigator, list or board, details). Narrower, the navigator becomes
// a select and details become a sheet, so the same app serves the sidebar panel and the center tab.

import { useEffect } from 'preact/hooks'
import { CircleAlert, Undo2, X } from 'lucide-preact'
import { BoardView } from './components/BoardView'
import { Detail } from './components/Detail'
import { Header } from './components/Header'
import { ListView } from './components/ListView'
import { Progress, Rail } from './components/Rail'
import { AgentDialog } from './components/AgentDialog'
import { Sheets } from './components/Sheets'
import { IconButton, Kbd, MOD, Sheet } from './components/ui'
import { t } from './i18n/t'
import { onKeyDown } from './keys'
import {
  detailOpen,
  filter,
  lastUndoable,
  load,
  loaded,
  loadError,
  notice,
  openComposer,
  saveError,
  select,
  selected,
  setScope,
  states,
  todos,
  undo,
  view,
  visible,
  wide
} from './store'
import './App.css'

export function App() {
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const todo = detailOpen.value ? selected.value : null
  return (
    <div class="app">
      <Rail />
      <main class="app__main">
        <Header />
        <div class={`app__content app__content--${view.value}`}>
          <Body />
        </div>
        <footer class="app__statusbar">
          <Progress compact />
        </footer>
      </main>
      {todo &&
        (wide.value ? (
          <aside class="app__detail-pane" aria-label={t.todoDetails}>
            <Detail key={todo.id} todo={todo} />
          </aside>
        ) : (
          <Sheet label={t.todoDetails} onClose={() => select(todo.id, false)}>
            <Detail key={todo.id} todo={todo} />
          </Sheet>
        ))}
      <Sheets />
      <AgentDialog />
      {saveError.value ? <SaveErrorToast /> : notice.value ? <NoticeToast /> : <UndoToast />}
    </div>
  )
}

function Body() {
  if (loadError.value) return <LoadError />
  if (!loaded.value) return <Skeleton />
  return view.value === 'list' ? <ListBody /> : <BoardView />
}

function LoadError() {
  return (
    <div class="empty" role="alert">
      <p class="empty__title">{t.loadErrorTitle}</p>
      <p>{t.loadErrorBody}</p>
      <p>
        <button type="button" class="btn btn--outline btn--sm" onClick={() => void load()}>
          {t.tryAgain}
        </button>
      </p>
    </div>
  )
}

function ListBody() {
  return (
    <>
      <ListView />
      <Empty />
    </>
  )
}

/** Empty states teach the next step instead of just saying "nothing here". */
function Empty() {
  if (visible.value.length) return null
  const f = filter.value
  if (!todos.value.length)
    return (
      <div class="empty">
        <p class="empty__title">{t.emptyTitle}</p>
        <p>{t.emptyBody(<Kbd>N</Kbd>, <Kbd>↵</Kbd>, <Kbd>1</Kbd>, <Kbd>{Math.min(9, states.value.length)}</Kbd>)}</p>
        <p>
          <button type="button" class="btn btn--outline btn--sm" onClick={() => openComposer()}>
            {t.addATodo}
          </button>
        </p>
      </div>
    )
  if (f.text.trim() || f.priority)
    return (
      <div class="empty">
        <p class="empty__title">{t.noMatchesTitle}</p>
        <p>{t.noMatchesBody}</p>
        <p>
          <button
            type="button"
            class="btn btn--outline btn--sm"
            onClick={() => (filter.value = { ...f, text: '', priority: '' })}
          >
            {t.clearSearchAndFilter}
          </button>
        </p>
      </div>
    )
  if (f.archived)
    return (
      <div class="empty">
        <p class="empty__title">{t.nothingArchivedTitle}</p>
        <p>{t.nothingArchivedBody(<Kbd>A</Kbd>)}</p>
      </div>
    )
  if (f.tags.length)
    return (
      <div class="empty">
        <p>{t.noOpenTagged(f.tags[0])}</p>
        <p>
          <button type="button" class="btn btn--ghost btn--sm" onClick={() => setScope({ kind: 'all' })}>
            {t.showAllTodos}
          </button>
        </p>
      </div>
    )
  return null
}

function Skeleton() {
  return (
    <div class="skeleton" aria-busy="true" aria-label={t.loading}>
      {[62, 48, 71, 40, 55].map((w, i) => (
        <div key={i} class="skeleton__row">
          <span class="skeleton__dot" />
          <span class="skeleton__bar" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  )
}

function UndoToast() {
  const last = lastUndoable.value
  useEffect(() => {
    if (!last) return
    const t = setTimeout(() => {
      if (lastUndoable.value === last) lastUndoable.value = null
    }, 8000)
    return () => clearTimeout(t)
  }, [last])
  if (!last) return null
  return (
    <div class="toast" role="status">
      <span class="toast__text">{last.text}</span>
      <button type="button" class="btn btn--outline btn--xs" onClick={undo}>
        <Undo2 />
        {t.undo} <Kbd small>{MOD}Z</Kbd>
      </button>
      <IconButton label={t.dismiss} class="btn--icon-xs" onClick={() => (lastUndoable.value = null)}>
        <X />
      </IconButton>
    </div>
  )
}

/** The result of the last action, such as a copy. It clears itself after a few seconds. */
function NoticeToast() {
  const current = notice.value
  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => {
      if (notice.value === current) notice.value = null
    }, 4000)
    return () => clearTimeout(t)
  }, [current])
  if (!current) return null
  return (
    <div class={current.error ? 'toast toast--error' : 'toast'} role={current.error ? 'alert' : 'status'}>
      {current.error && <CircleAlert />}
      <span class="toast__text">{current.text}</span>
      <IconButton label={t.dismiss} class="btn--icon-xs" onClick={() => (notice.value = null)}>
        <X />
      </IconButton>
    </div>
  )
}

/** A write failed: say so until dismissed, since the change may be gone after a reload. */
function SaveErrorToast() {
  return (
    <div class="toast toast--error" role="alert">
      <CircleAlert />
      <span class="toast__text">{t.saveFailed}</span>
      <IconButton label={t.dismiss} class="btn--icon-xs" onClick={() => (saveError.value = null)}>
        <X />
      </IconButton>
    </div>
  )
}
