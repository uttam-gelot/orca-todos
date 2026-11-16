// The selected todo, edited in place. Title and tags save on Enter or blur; the description saves
// as you type (debounced) and on leaving the editor.

import { useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import {
  Archive,
  ArchiveArrowUp,
  ArrowLeft,
  Bold,
  Code,
  Copy,
  Italic,
  Link,
  List,
  ListChecks,
  Pencil,
  Trash,
  X
} from 'lucide-preact'
import { focusRequest } from '../focus'
import { formatDate, t } from '../i18n/t'
import { checklist, normalizeTags, PRIORITIES, toggleTask, type Todo } from '../model'
import { continueList } from '../editing'
import { onMarkdownClick, renderMarkdown, taskIndex } from '../markdown'
import {
  copyPrompt,
  deleteTodo,
  moveTodo,
  select,
  setScope,
  stateById,
  states,
  tagCounts,
  toggleArchived,
  updateTodo,
  wide
} from '../store'
import { AgentButton, RunList } from './AgentRun'
import { IconButton, Kbd, MOD, PriorityIcon, StateIcon } from './ui'
import './Detail.css'

export function Detail({ todo }: { todo: Todo }) {
  const state = stateById.value.get(todo.stateId)
  const close = () => select(todo.id, false)
  return (
    <div class={wide.value ? 'detail' : 'detail detail--sheet'}>
      <header class="detail__bar">
        {!wide.value && (
          <IconButton label={t.back} onClick={close}>
            <ArrowLeft />
          </IconButton>
        )}
        <span class="detail__crumb">
          <StateIcon state={state} />
          {state?.name}
        </span>
        <span class="spacer" />
        <AgentButton todo={todo} class="detail__agent" />
        <IconButton label={`${t.copyAsPrompt} (Y)`} onClick={() => copyPrompt(todo.id)}>
          <Copy />
        </IconButton>
        <IconButton label={`${todo.archived ? t.unarchive : t.archive} (A)`} onClick={() => toggleArchived(todo.id)}>
          {todo.archived ? <ArchiveArrowUp /> : <Archive />}
        </IconButton>
        <IconButton label={`${t.delete} (Delete)`} class="btn--danger" onClick={() => deleteTodo(todo.id)}>
          <Trash />
        </IconButton>
        {wide.value && (
          <IconButton label={`${t.close} (Esc)`} onClick={close}>
            <X />
          </IconButton>
        )}
      </header>

      <div class="detail__body">
        <Title todo={todo} />
        {todo.archived && <p class="detail__notice">{t.archivedNotice}</p>}

        <dl class="detail__props">
          <dt class="detail__prop-term">{t.state}</dt>
          <dd class="detail__prop-value">
            <label class="picker">
              <StateIcon state={state} />
              <select
                class="picker__select"
                aria-label={t.state}
                value={todo.stateId}
                onChange={(e) => moveTodo(todo.id, e.currentTarget.value)}
              >
                {states.value.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {i < 9 ? `  ·  ${i + 1}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </dd>
          <dt class="detail__prop-term">{t.priority}</dt>
          <dd class="detail__prop-value">
            <label class="picker">
              <PriorityIcon priority={todo.priority} />
              <select
                class="picker__select"
                aria-label={t.priority}
                value={todo.priority}
                onChange={(e) => updateTodo(todo.id, { priority: e.currentTarget.value as Todo['priority'] })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t.priorities[p]}
                  </option>
                ))}
              </select>
            </label>
          </dd>
          <dt class="detail__prop-term">{t.tags}</dt>
          <dd class="detail__prop-value">
            <TagEditor todo={todo} />
          </dd>
        </dl>

        <Description todo={todo} />

        <RunList todo={todo} />

        <p class="detail__meta count">
          {t.dates(
            formatDate(todo.createdAt),
            formatDate(todo.updatedAt),
            todo.closedAt ? formatDate(todo.closedAt) : undefined
          )}
        </p>
      </div>
    </div>
  )
}

function Title({ todo }: { todo: Todo }) {
  const draft = useSignal(todo.title)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (focusRequest.field !== 'title') return
    focusRequest.field = null
    ref.current?.focus()
    ref.current?.select()
  }, [todo.id])
  const commit = () => {
    const text = draft.value.replace(/\s+/g, ' ').trim()
    if (text && text !== todo.title) updateTodo(todo.id, { title: text })
    else draft.value = todo.title
  }
  return (
    <textarea
      ref={ref}
      class="detail__title"
      rows={1}
      aria-label={t.title}
      value={draft.value}
      onInput={(e) => (draft.value = e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === 'Escape') {
          e.stopPropagation()
          draft.value = todo.title
          requestAnimationFrame(() => ref.current?.blur())
        }
      }}
    />
  )
}

function TagEditor({ todo }: { todo: Todo }) {
  const draft = useSignal('')
  const add = () => {
    const next = normalizeTags(draft.value).filter((t) => !todo.tags.includes(t))
    if (next.length) updateTodo(todo.id, { tags: [...todo.tags, ...next] })
    draft.value = ''
  }
  const remove = (tag: string) => updateTodo(todo.id, { tags: todo.tags.filter((t) => t !== tag) })
  const listId = `tags-${todo.id}`
  return (
    <div class="tag-editor">
      {todo.tags.map((tag) => (
        <span key={tag} class="chip">
          <button
            type="button"
            class="chip__label"
            title={t.showTag(tag)}
            onClick={() => setScope({ kind: 'tag', id: tag })}
          >
            #{tag}
          </button>
          <button type="button" class="chip__remove" aria-label={t.removeTag(tag)} onClick={() => remove(tag)}>
            <X />
          </button>
        </span>
      ))}
      <input
        class="tag-editor__input"
        aria-label={t.addTag}
        placeholder={todo.tags.length ? t.add : t.addTags}
        list={listId}
        value={draft.value}
        onInput={(e) => (draft.value = e.currentTarget.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          }
          if (e.key === 'Backspace' && !draft.value && todo.tags.length) remove(todo.tags.at(-1)!)
          if (e.key === 'Escape') {
            e.stopPropagation()
            draft.value = ''
            e.currentTarget.blur()
          }
        }}
      />
      <datalist id={listId}>
        {tagCounts.value
          .filter(([t]) => !todo.tags.includes(t))
          .map(([t]) => (
            <option key={t} value={t} />
          ))}
      </datalist>
    </div>
  )
}

// [before, after, placeholder] wrapped around the selection.
// `label` names a message, so the toolbar follows the interface language.
const FORMATS = [
  { icon: Bold, label: 'bold', key: 'b', wrap: ['**', '**', 'bold'] },
  { icon: Italic, label: 'italic', key: 'i', wrap: ['_', '_', 'italic'] },
  { icon: Code, label: 'code', key: 'e', wrap: ['`', '`', 'code'] },
  { icon: Link, label: 'link', key: 'k', wrap: ['[', '](https://)', 'text'] },
  { icon: List, label: 'bulletedList', key: '', wrap: ['\n- ', '', 'item'] },
  { icon: ListChecks, label: 'checklist', key: '', wrap: ['\n- [ ] ', '', 'item'] }
] as const

function Description({ todo }: { todo: Todo }) {
  const editing = useSignal(focusRequest.field === 'description')
  const draft = useSignal(todo.description)
  const area = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (focusRequest.field === 'description') {
      focusRequest.field = null
      editing.value = true
    }
  })
  useEffect(() => {
    if (editing.value) area.current?.focus()
  }, [editing.value])
  // Flush a pending save when the pane closes or switches todo.
  useEffect(() => () => save(), [])

  const save = () => {
    clearTimeout(timer.current)
    if (draft.value !== todo.description) updateTodo(todo.id, { description: draft.value })
  }
  const done = () => {
    save()
    editing.value = false
  }
  const format = ([before, after, placeholder]: readonly [string, string, string]) => {
    const el = area.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const text = value.slice(s, e) || placeholder
    draft.value = value.slice(0, s) + before + text + after + value.slice(e)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + before.length, s + before.length + text.length)
    })
  }

  if (!editing.value)
    return (
      <section class="description">
        {todo.description.trim() ? (
          <div class="description__preview">
            <div
              class="md"
              onClick={(e) => {
                const index = taskIndex(e.target, e.currentTarget)
                if (index < 0) return onMarkdownClick(e)
                // Only when the page and the notes agree on the items, so the right one is ticked.
                const boxes = e.currentTarget.querySelectorAll('li > input[type="checkbox"]').length
                if (boxes !== checklist(todo.description).total) return e.preventDefault()
                const next = toggleTask(todo.description, index)
                draft.value = next
                updateTodo(todo.id, { description: next })
              }}
              onDblClick={(e) => taskIndex(e.target, e.currentTarget) < 0 && (editing.value = true)}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(todo.description, { tasks: true }) }}
            />
            <IconButton
              label={`${t.editDescription} (E)`}
              class="description__edit btn--icon-xs"
              onClick={() => (editing.value = true)}
            >
              <Pencil />
            </IconButton>
          </div>
        ) : (
          <button type="button" class="description__empty" onClick={() => (editing.value = true)}>
            {t.notesEmpty}
            <Kbd>E</Kbd>
          </button>
        )}
      </section>
    )

  return (
    <section class="description">
      <div class="description__format-bar">
        {FORMATS.map(({ icon: Icon, label, key, wrap }) => (
          <IconButton
            key={label}
            label={key ? `${t[label]} (${MOD}${key.toUpperCase()})` : t[label]}
            class="btn--icon-xs"
            onMouseDown={(e: MouseEvent) => e.preventDefault()}
            onClick={() => format(wrap)}
          >
            <Icon />
          </IconButton>
        ))}
        <span class="spacer" />
        <button type="button" class="btn btn--outline btn--xs" onClick={done}>
          {t.done} <Kbd small>{MOD}↵</Kbd>
        </button>
      </div>
      <textarea
        ref={area}
        class="description__input"
        aria-label={t.notesLabel}
        placeholder={t.notesPlaceholder}
        value={draft.value}
        onInput={(e) => {
          draft.value = e.currentTarget.value
          clearTimeout(timer.current)
          timer.current = window.setTimeout(save, 600)
        }}
        onBlur={save}
        onKeyDown={(e) => {
          const mod = e.metaKey || e.ctrlKey
          if (e.key === 'Escape' || (mod && e.key === 'Enter')) {
            e.preventDefault()
            e.stopPropagation()
            done()
            return
          }
          // Enter continues a list; not while an input method is composing, nor with Shift.
          if (e.key === 'Enter' && !mod && !e.shiftKey && !e.altKey && !e.isComposing) {
            const el = e.currentTarget
            const next = continueList(el.value, el.selectionStart, el.selectionEnd)
            if (next) {
              e.preventDefault()
              draft.value = next.value
              el.value = next.value
              el.setSelectionRange(next.caret, next.caret)
              clearTimeout(timer.current)
              timer.current = window.setTimeout(save, 600)
              return
            }
          }
          const f = mod && FORMATS.find((x) => x.key && x.key === e.key.toLowerCase())
          if (f) {
            e.preventDefault()
            format(f.wrap)
          }
        }}
      />
    </section>
  )
}
