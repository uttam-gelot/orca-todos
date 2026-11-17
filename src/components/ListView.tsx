// List: state groups → rows. Selecting a row opens it in the detail pane.

import { ChevronRight, Plus } from 'lucide-preact'
import type { State, Todo } from '../model'
import {
  collapsed,
  filter,
  groups,
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
import { ago, DoneToggle, DueChip, IconButton, ProjectChip, NotesHint, PriorityIcon, StateIcon } from './ui'
import './ListView.css'

export function ListView() {
  const single = Boolean(filter.value.stateId)
  return (
    <div
      class="list"
      role="listbox"
      aria-label={t.todos}
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
              label={t.addTo(state.name)}
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
          <AddSlot stateId={state.id} variant="row" />
        </div>
      )}
    </section>
  )
}

function Row({ todo }: { todo: Todo }) {
  const state = stateById.value.get(todo.stateId)
  const current = selectedId.value === todo.id
  const run = latestRun(todo)
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
      <DoneToggle state={state} onToggle={() => toggleDone(todo.id)} />
      <span class="row__title">{todo.title}</span>
      <NotesHint description={todo.description} />
      {todo.due && <DueChip due={todo.due} closed={state?.closed} />}
      <span class="row__tags">
        <ProjectChip project={todo.project} />
        {todo.tags.map((tag) => (
          <span key={tag} class="tag">
            #{tag}
          </span>
        ))}
      </span>
      {run && <RunBadge run={run} unseen={!current && isUnseen(todo, seen.value)} class="row__run" />}
      <AgentButton todo={todo} class="row__agent" />
      <span class="row__age count" title={t.updatedOn(formatLong(todo.updatedAt))}>
        {ago(todo.updatedAt)}
      </span>
    </div>
  )
}
