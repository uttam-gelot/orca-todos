// Board: one column per state. Drag a card onto another card to place it before that card, or onto
// a column's empty space (or its collapsed strip) to put it last. From the keyboard: Shift+←/→ or 1–9 move the selected card.

import { signal } from '@preact/signals'
import { ChevronsRightLeft, Plus } from 'lucide-preact'
import type { State, Todo } from '../model'
import {
  collapsed,
  filter,
  groups,
  moveTodo,
  openComposer,
  select,
  selectedId,
  stateById,
  toggleCollapsed,
  toggleDone
} from '../store'
import { latestRun } from '../agents'
import { isUnseen, seen } from '../seen'
import { AgentButton, RunBadge } from './AgentRun'
import { AddSlot } from './Composer'
import { formatLong, t } from '../i18n/t'
import { ago, DoneToggle, DueChip, IconButton, NotesHint, PriorityIcon, StateIcon } from './ui'
import './BoardView.css'

const dragging = signal<string | null>(null)
const dropTarget = signal<string | null>(null) // a state id or a todo id

export function BoardView() {
  return (
    <div class="board">
      {groups.value.map(({ state, items }) => (
        <Column key={state.id} state={state} items={items} />
      ))}
    </div>
  )
}

function drop(e: DragEvent, stateId: string, beforeId: string | null) {
  e.preventDefault()
  e.stopPropagation()
  const id = e.dataTransfer?.getData('text/plain') || dragging.value
  if (id) moveTodo(id, stateId, beforeId)
  dragging.value = dropTarget.value = null
}

function Column({ state, items }: { state: State; items: Todo[] }) {
  // A board narrowed to one state shows it open, as the list does.
  const shut = collapsed.value.has(state.id) && !filter.value.stateId
  return (
    <section
      class={['column', shut && 'column--shut', dropTarget.value === state.id && 'column--over']
        .filter(Boolean)
        .join(' ')}
      style={{ '--column-color': state.color }}
      aria-label={state.name}
      onDragOver={(e) => {
        e.preventDefault()
        dropTarget.value = state.id
      }}
      onDragLeave={(e) => {
        if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) dropTarget.value = null
      }}
      onDrop={(e) => drop(e, state.id, null)}
    >
      {shut ? (
        <button
          type="button"
          class="column__strip"
          aria-expanded="false"
          title={t.expand(state.name)}
          onClick={() => toggleCollapsed(state.id)}
        >
          <StateIcon state={state} />
          <span class="count">{items.length}</span>
          <span class="column__name">{state.name}</span>
        </button>
      ) : (
        <ColumnBody state={state} items={items} />
      )}
    </section>
  )
}

function ColumnBody({ state, items }: { state: State; items: Todo[] }) {
  return (
    <>
      <header class="column__head">
        <StateIcon state={state} />
        <span class="column__name">{state.name}</span>
        <span class="count">{items.length}</span>
        <IconButton
          label={t.collapse(state.name)}
          class="btn--icon-xs column__collapse"
          aria-expanded="true"
          onClick={() => toggleCollapsed(state.id)}
        >
          <ChevronsRightLeft />
        </IconButton>
        {!filter.value.archived && (
          <IconButton
            label={t.addTo(state.name)}
            class="btn--icon-xs column__add"
            onClick={() => openComposer(state.id)}
          >
            <Plus />
          </IconButton>
        )}
      </header>
      <div class="column__cards" role="listbox" aria-label={state.name}>
        {items.map((t) => (
          <Card key={t.id} todo={t} />
        ))}
        <AddSlot stateId={state.id} variant="card" />
      </div>
    </>
  )
}

function Card({ todo }: { todo: Todo }) {
  const run = latestRun(todo)
  const state = stateById.value.get(todo.stateId)
  return (
    <div
      data-id={todo.id}
      role="option"
      aria-selected={selectedId.value === todo.id}
      class={['card', dragging.value === todo.id && 'card--dragging', dropTarget.value === todo.id && 'card--over']
        .filter(Boolean)
        .join(' ')}
      draggable
      onDragStart={(e) => {
        e.dataTransfer?.setData('text/plain', todo.id)
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
        dragging.value = todo.id
      }}
      onDragEnd={() => (dragging.value = dropTarget.value = null)}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        dropTarget.value = todo.id
      }}
      onDrop={(e) => drop(e, todo.stateId, todo.id)}
      onClick={() => select(todo.id, true)}
    >
      <div class="card__head">
        <DoneToggle state={state} onToggle={() => toggleDone(todo.id)} class="card__toggle" />
        <div class="card__title">{todo.title}</div>
      </div>
      <div class="card__meta">
        {todo.priority !== 'none' && <PriorityIcon priority={todo.priority} />}
        {todo.due && <DueChip due={todo.due} closed={state?.closed} />}
        <NotesHint description={todo.description} />
        {todo.tags.length > 0 && (
          <span class="card__tags" title={todo.tags.map((t) => `#${t}`).join(' ')}>
            {todo.tags.map((tag) => (
              <span key={tag} class="tag">
                #{tag}
              </span>
            ))}
          </span>
        )}
        <span class="card__end">
          {!run && <AgentButton todo={todo} class="card__agent" />}
          <span class="count" title={t.updatedOn(formatLong(todo.updatedAt))}>
            {ago(todo.updatedAt)}
          </span>
        </span>
      </div>
      {run && (
        <div class="card__run">
          <RunBadge run={run} unseen={selectedId.value !== todo.id && isUnseen(todo, seen.value)} />
          <AgentButton todo={todo} />
        </div>
      )}
    </div>
  )
}
