// The selected todo, edited in place. Title and tags save on Enter or blur; the description saves
// as you type (debounced) and on leaving the editor.

import { useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'
import { Archive, ArchiveArrowUp, ArrowLeft, Bold, Code, Italic, Link, List, Pencil, Trash, X } from 'lucide-preact'
import { focusRequest } from '../focus'
import { normalizeTags, PRIORITIES, type Todo } from '../model'
import { onMarkdownClick, renderMarkdown } from '../markdown'
import { deleteTodo, moveTodo, select, setScope, stateById, states, tagCounts, updateTodo, wide } from '../store'
import { formatDate, IconButton, Kbd, MOD, PRIORITY_LABEL, PriorityIcon, StateIcon } from './ui'
import './Detail.css'

export function Detail({ todo }: { todo: Todo }) {
  const state = stateById.value.get(todo.stateId)
  const close = () => select(todo.id, false)
  return (
    <div class={wide.value ? 'detail' : 'detail detail--sheet'}>
      <header class="detail__bar">
        {!wide.value && (
          <IconButton label="Back" onClick={close}>
            <ArrowLeft />
          </IconButton>
        )}
        <span class="detail__crumb">
          <StateIcon state={state} />
          {state?.name}
        </span>
        <span class="spacer" />
        <IconButton
          label={todo.archived ? 'Unarchive (A)' : 'Archive (A)'}
          onClick={() => updateTodo(todo.id, { archived: !todo.archived })}
        >
          {todo.archived ? <ArchiveArrowUp /> : <Archive />}
        </IconButton>
        <IconButton label="Delete (Delete)" class="btn--danger" onClick={() => deleteTodo(todo.id)}>
          <Trash />
        </IconButton>
        {wide.value && (
          <IconButton label="Close (Esc)" onClick={close}>
            <X />
          </IconButton>
        )}
      </header>

      <div class="detail__body">
        <Title todo={todo} />
        {todo.archived && <p class="detail__notice">Archived. It is hidden from every scope except Archived.</p>}

        <dl class="detail__props">
          <dt class="detail__prop-term">State</dt>
          <dd class="detail__prop-value">
            <label class="picker">
              <StateIcon state={state} />
              <select
                class="picker__select"
                aria-label="State"
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
          <dt class="detail__prop-term">Priority</dt>
          <dd class="detail__prop-value">
            <label class="picker">
              <PriorityIcon priority={todo.priority} />
              <select
                class="picker__select"
                aria-label="Priority"
                value={todo.priority}
                onChange={(e) => updateTodo(todo.id, { priority: e.currentTarget.value as Todo['priority'] })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
          </dd>
          <dt class="detail__prop-term">Tags</dt>
          <dd class="detail__prop-value">
            <TagEditor todo={todo} />
          </dd>
        </dl>

        <Description todo={todo} />

        <p class="detail__meta count">
          Created {formatDate(todo.createdAt)} · Updated {formatDate(todo.updatedAt)}
          {todo.closedAt ? ` · Closed ${formatDate(todo.closedAt)}` : ''}
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
      aria-label="Title"
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
            title={`Show #${tag}`}
            onClick={() => setScope({ kind: 'tag', id: tag })}
          >
            #{tag}
          </button>
          <button type="button" class="chip__remove" aria-label={`Remove #${tag}`} onClick={() => remove(tag)}>
            <X />
          </button>
        </span>
      ))}
      <input
        class="tag-editor__input"
        aria-label="Add tag"
        placeholder={todo.tags.length ? 'Add' : 'Add tags'}
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
const FORMATS = [
  { icon: Bold, label: 'Bold', key: 'b', wrap: ['**', '**', 'bold'] },
  { icon: Italic, label: 'Italic', key: 'i', wrap: ['_', '_', 'italic'] },
  { icon: Code, label: 'Code', key: 'e', wrap: ['`', '`', 'code'] },
  { icon: Link, label: 'Link', key: 'k', wrap: ['[', '](https://)', 'text'] },
  { icon: List, label: 'Bulleted list', key: '', wrap: ['\n- ', '', 'item'] }
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
              onClick={onMarkdownClick}
              onDblClick={() => (editing.value = true)}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(todo.description) }}
            />
            <IconButton
              label="Edit description (E)"
              class="description__edit btn--icon-xs"
              onClick={() => (editing.value = true)}
            >
              <Pencil />
            </IconButton>
          </div>
        ) : (
          <button type="button" class="description__empty" onClick={() => (editing.value = true)}>
            Add notes, links or a checklist. Markdown works.
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
            label={key ? `${label} (${MOD}${key.toUpperCase()})` : label}
            class="btn--icon-xs"
            onMouseDown={(e: MouseEvent) => e.preventDefault()}
            onClick={() => format(wrap)}
          >
            <Icon />
          </IconButton>
        ))}
        <span class="spacer" />
        <button type="button" class="btn btn--outline btn--xs" onClick={done}>
          Done <Kbd small>{MOD}↵</Kbd>
        </button>
      </div>
      <textarea
        ref={area}
        class="description__input"
        aria-label="Description (markdown)"
        placeholder="Markdown: **bold**, - lists, [links](https://…)"
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
