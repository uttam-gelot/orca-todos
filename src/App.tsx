// Three panes on a wide surface (navigator, list or board, details). Narrower, the navigator becomes
// a select and details become a sheet, so the same app serves the sidebar panel and the center tab.

import { useEffect } from 'preact/hooks'
import { CircleAlert, Undo2, X } from 'lucide-preact'
import { BoardView } from './components/BoardView'
import { Detail } from './components/Detail'
import { Header } from './components/Header'
import { ListView } from './components/ListView'
import { Progress, Rail } from './components/Rail'
import { Sheets } from './components/Sheets'
import { IconButton, Kbd, MOD, Sheet } from './components/ui'
import { onKeyDown } from './keys'
import {
  detailOpen,
  filter,
  lastDeleted,
  load,
  loaded,
  loadError,
  openComposer,
  saveError,
  select,
  selected,
  setScope,
  states,
  todos,
  undoDelete,
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
          <aside class="app__detail-pane" aria-label="To-do details">
            <Detail key={todo.id} todo={todo} />
          </aside>
        ) : (
          <Sheet label="To-do details" onClose={() => select(todo.id, false)}>
            <Detail key={todo.id} todo={todo} />
          </Sheet>
        ))}
      <Sheets />
      {saveError.value ? <SaveErrorToast /> : <UndoToast />}
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
      <p class="empty__title">Could not load your to-dos</p>
      <p>Orca plugin storage did not answer. Nothing was changed.</p>
      <p>
        <button type="button" class="btn btn--outline btn--sm" onClick={() => void load()}>
          Try again
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
        <p class="empty__title">No to-dos yet</p>
        <p>
          Press <Kbd>N</Kbd> to add one, type a title, then <Kbd>↵</Kbd>. Move it between states with <Kbd>1</Kbd>–
          <Kbd>{Math.min(9, states.value.length)}</Kbd>.
        </p>
        <p>
          <button type="button" class="btn btn--outline btn--sm" onClick={() => openComposer()}>
            Add a to-do
          </button>
        </p>
      </div>
    )
  if (f.text.trim() || f.priority)
    return (
      <div class="empty">
        <p class="empty__title">No matches</p>
        <p>Nothing here matches the search or priority filter.</p>
        <p>
          <button
            type="button"
            class="btn btn--outline btn--sm"
            onClick={() => (filter.value = { ...f, text: '', priority: '' })}
          >
            Clear search and filter
          </button>
        </p>
      </div>
    )
  if (f.archived)
    return (
      <div class="empty">
        <p class="empty__title">Nothing archived</p>
        <p>
          Archive a to-do with <Kbd>A</Kbd>, or archive every closed one from the display menu.
        </p>
      </div>
    )
  if (f.tags.length)
    return (
      <div class="empty">
        <p>No open to-dos tagged #{f.tags[0]}.</p>
        <p>
          <button type="button" class="btn btn--ghost btn--sm" onClick={() => setScope({ kind: 'all' })}>
            Show all to-dos
          </button>
        </p>
      </div>
    )
  return null
}

function Skeleton() {
  return (
    <div class="skeleton" aria-busy="true" aria-label="Loading">
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
  const todo = lastDeleted.value
  useEffect(() => {
    if (!todo) return
    const t = setTimeout(() => {
      if (lastDeleted.value === todo) lastDeleted.value = null
    }, 8000)
    return () => clearTimeout(t)
  }, [todo])
  if (!todo) return null
  return (
    <div class="toast" role="status">
      <span class="toast__text">Deleted “{todo.title}”</span>
      <button type="button" class="btn btn--outline btn--xs" onClick={undoDelete}>
        <Undo2 />
        Undo <Kbd small>{MOD}Z</Kbd>
      </button>
      <IconButton label="Dismiss" class="btn--icon-xs" onClick={() => (lastDeleted.value = null)}>
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
      <span class="toast__text">Could not save the last change. It may be lost when Orca reloads.</span>
      <IconButton label="Dismiss" class="btn--icon-xs" onClick={() => (saveError.value = null)}>
        <X />
      </IconButton>
    </div>
  )
}
