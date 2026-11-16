// Board: one column per state. Drag a card onto another card to place it before that card, or onto
// a column's empty space to put it last. From the keyboard: Shift+←/→ or 1–9 move the selected card.

import { signal } from '@preact/signals'
import { Plus } from 'lucide-preact'
import type { State, Todo } from '../model'
import { filter, groups, moveTodo, openComposer, select, selectedId, stateById, toggleDone } from '../store'
import { latestRun } from '../agents'
import { AgentButton, RunBadge } from './AgentRun'
import { AddSlot } from './Composer'
import { ago, DoneToggle, IconButton, NotesHint, PriorityIcon, StateIcon } from './ui'
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
  return (
    <section
      class={dropTarget.value === state.id ? 'column column--over' : 'column'}
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
      <header class="column__head">
        <StateIcon state={state} />
        <span class="column__name">{state.name}</span>
        <span class="count">{items.length}</span>
        {!filter.value.archived && (
          <IconButton
            label={`Add to ${state.name}`}
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
    </section>
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
        <NotesHint description={todo.description} />
        {run && <RunBadge run={run} />}
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
          <AgentButton todo={todo} class="card__agent" />
          <span class="count" title={`Updated ${new Date(todo.updatedAt).toLocaleString()}`}>
            {ago(todo.updatedAt)}
          </span>
        </span>
      </div>
    </div>
  )
}
