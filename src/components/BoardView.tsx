// Board: one column per state. Drag a card onto another card to place it before that card, or onto
// a column's empty space to put it last. From the keyboard: Shift+←/→ or 1–9 move the selected card.

import { signal } from '@preact/signals'
import { Plus, TextAlignStart } from 'lucide-preact'
import type { State, Todo } from '../model'
import { composer, filter, groups, moveTodo, openComposer, select, selectedId } from '../store'
import { Composer } from './Composer'
import { IconButton, PriorityIcon, StateIcon } from './ui'
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
        {composer.value === state.id && <Composer stateId={state.id} variant="card" />}
      </div>
    </section>
  )
}

function Card({ todo }: { todo: Todo }) {
  const hasMeta = todo.priority !== 'none' || todo.tags.length > 0 || todo.description.trim()
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
      <div class="card__title">{todo.title}</div>
      {hasMeta && (
        <div class="card__meta">
          {todo.priority !== 'none' && <PriorityIcon priority={todo.priority} />}
          {todo.description.trim() && <TextAlignStart class="card__note" aria-label="Has notes" />}
          {todo.tags.map((tag) => (
            <span key={tag} class="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
