// Inline capture: a title and Enter. Stays open for the next one; Esc closes. `#tag`, `!high` and
// `@fri` words in the title set tags, the priority and the due date.

import { useSignal } from '@preact/signals'
import { Plus } from 'lucide-preact'
import { parseQuickAdd } from '../model'
import { composer, createTodo, filter, openComposer, select, stateById } from '../store'
import { t } from '../i18n/t'
import { Kbd, StateIcon } from './ui'
import './Composer.css'

export function Composer({ stateId, variant }: { stateId: string; variant: 'row' | 'card' }) {
  const title = useSignal('')
  const state = stateById.value.get(stateId)
  return (
    <form
      class={`composer composer--${variant}`}
      onSubmit={(e) => {
        e.preventDefault()
        const text = title.value.trim()
        if (!text) return
        const { title: name, tags, priority, due } = parseQuickAdd(text)
        const todo = createTodo({
          title: name,
          stateId,
          tags: [...new Set([...filter.value.tags, ...tags])],
          ...(priority && { priority }),
          ...(due && { due })
        })
        select(todo.id, false)
        title.value = ''
      }}
    >
      <StateIcon state={state} />
      <input
        class="composer__input"
        autoFocus
        aria-label={t.newTodoIn(state?.name ?? t.state)}
        placeholder={t.composerPlaceholder}
        value={title.value}
        onInput={(e) => (title.value = e.currentTarget.value)}
        onBlur={() => !title.value.trim() && (composer.value = null)}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          e.stopPropagation()
          composer.value = null
        }}
      />
      <Kbd>↵</Kbd>
    </form>
  )
}

/**
 * Where a group or column ends: the composer while it is open there, else a quiet "Add to-do" row
 * that opens it. Closed states and the archive get neither; their head's + still adds.
 */
export function AddSlot({ stateId, variant }: { stateId: string; variant: 'row' | 'card' }) {
  if (composer.value === stateId) return <Composer stateId={stateId} variant={variant} />
  if (filter.value.archived || stateById.value.get(stateId)?.closed) return null
  return (
    <button type="button" class={`add-slot add-slot--${variant}`} onClick={() => openComposer(stateId)}>
      <Plus aria-hidden="true" />
      {t.addTodo}
    </button>
  )
}
