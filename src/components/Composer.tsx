// Inline capture: a title and Enter. Stays open for the next one; Esc closes. `#tag` and `!high`
// words in the title set tags and the priority.

import { useSignal } from '@preact/signals'
import { parseQuickAdd } from '../model'
import { composer, createTodo, filter, select, stateById } from '../store'
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
        const { title: name, tags, priority } = parseQuickAdd(text)
        const todo = createTodo({
          title: name,
          stateId,
          tags: [...new Set([...filter.value.tags, ...tags])],
          ...(priority && { priority })
        })
        select(todo.id, false)
        title.value = ''
      }}
    >
      <StateIcon state={state} />
      <input
        class="composer__input"
        autoFocus
        aria-label={`New to-do in ${state?.name ?? 'state'}`}
        placeholder="To-do title (#tag !high)"
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
