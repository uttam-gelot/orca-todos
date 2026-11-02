// List: state groups → rows. Selecting a row opens it in the detail pane.

import { ChevronRight, Plus, TextAlignStart } from 'lucide-preact'
import type { State, Todo } from '../model'
import {
  collapsed,
  composer,
  filter,
  groups,
  openComposer,
  select,
  selectedId,
  stateById,
  toggleCollapsed,
  toggleDone
} from '../store'
import { Composer } from './Composer'
import { ago, IconButton, PriorityIcon, StateIcon } from './ui'
import './ListView.css'

export function ListView() {
  const single = Boolean(filter.value.stateId)
  return (
    <div
      class="list"
      role="listbox"
      aria-label="To-dos"
      aria-activedescendant={selectedId.value ? `todo-${selectedId.value}` : undefined}
    >
      {groups.value.map(({ state, items }) => (
        <Group key={state.id} state={state} items={items} single={single} />
      ))}
    </div>
  )
}

function Group({ state, items, single }: { state: State; items: Todo[]; single: boolean }) {
  const shut = !single && collapsed.value.has(state.id)
  const archived = filter.value.archived
  return (
    <section class="group" aria-label={state.name}>
      {!single && (
        <header class="group__head">
          <button type="button" class="group__toggle" aria-expanded={!shut} onClick={() => toggleCollapsed(state.id)}>
            <ChevronRight class="group__chevron" />
            <StateIcon state={state} />
            <span class="group__name">{state.name}</span>
            <span class="count">{items.length}</span>
          </button>
          {!archived && (
            <IconButton
              label={`Add to ${state.name}`}
              class="btn--icon-xs group__add"
              onClick={() => openComposer(state.id)}
            >
              <Plus />
            </IconButton>
          )}
        </header>
      )}
      {!shut && (
        <div class="group__rows">
          {items.map((t) => (
            <Row key={t.id} todo={t} />
          ))}
          {composer.value === state.id && <Composer stateId={state.id} variant="row" />}
        </div>
      )}
    </section>
  )
}

function Row({ todo }: { todo: Todo }) {
  const state = stateById.value.get(todo.stateId)
  const current = selectedId.value === todo.id
  return (
    <div
      id={`todo-${todo.id}`}
      data-id={todo.id}
      role="option"
      aria-selected={current}
      class={state?.closed ? 'row row--closed' : 'row'}
      onClick={() => select(todo.id, true)}
    >
      <PriorityIcon priority={todo.priority} />
      <button
        type="button"
        class="row__toggle"
        aria-label={state?.closed ? 'Reopen' : 'Mark done'}
        title={state?.closed ? 'Reopen (X)' : 'Mark done (X)'}
        onClick={(e) => {
          e.stopPropagation()
          toggleDone(todo.id)
        }}
      >
        <StateIcon state={state} />
      </button>
      <span class="row__title">{todo.title}</span>
      {todo.description.trim() && <TextAlignStart class="row__note" aria-label="Has notes" />}
      <span class="row__tags">
        {todo.tags.map((tag) => (
          <span key={tag} class="tag">
            #{tag}
          </span>
        ))}
      </span>
      <span class="row__age count" title={`Updated ${new Date(todo.updatedAt).toLocaleString()}`}>
        {ago(todo.updatedAt)}
      </span>
    </div>
  )
}
