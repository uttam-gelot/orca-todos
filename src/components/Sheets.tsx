// Edge sheets: managing states, and the keyboard shortcut list.

import { useSignal } from '@preact/signals'
import { ArrowDown, ArrowUp, Trash } from 'lucide-preact'
import type { State } from '../model'
import { addState, deleteState, moveState, sheet, states, summary, updateState } from '../store'
import { IconButton, Kbd, MOD, Sheet, SheetHeader } from './ui'
import './Sheets.css'

const close = () => (sheet.value = null)

export function Sheets() {
  if (sheet.value === 'states')
    return (
      <Sheet label="States" onClose={close}>
        <SheetHeader title="States" onClose={close} />
        <StatesBody />
      </Sheet>
    )
  if (sheet.value === 'shortcuts')
    return (
      <Sheet label="Keyboard shortcuts" onClose={close}>
        <SheetHeader title="Keyboard shortcuts" onClose={close} />
        <ShortcutsBody />
      </Sheet>
    )
  return null
}

function StatesBody() {
  const name = useSignal('')
  return (
    <div class="sheet__body state-editor">
      <p class="sheet__hint">Order here is the order of list groups and board columns. Closed states count as done.</p>
      <ul class="state-editor__list">
        {states.value.map((s, i) => (
          <StateRow key={s.id} state={s} index={i} />
        ))}
      </ul>
      <form
        class="state-editor__add"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.value.trim()) return
          addState(name.value.trim())
          name.value = ''
        }}
      >
        <input
          class="input state-editor__name"
          placeholder="New state name"
          aria-label="New state name"
          value={name.value}
          onInput={(e) => (name.value = e.currentTarget.value)}
        />
        <button type="submit" class="btn btn--outline btn--sm" disabled={!name.value.trim()}>
          Add state
        </button>
      </form>
    </div>
  )
}

function StateRow({ state, index }: { state: State; index: number }) {
  const confirming = useSignal(false)
  const list = states.value
  const count = summary.value.perState.find((p) => p.state.id === state.id)?.count ?? 0
  const fallback = list.find((s) => s.id !== state.id)
  return (
    <li class="state-editor__row">
      <input
        type="color"
        class="state-editor__swatch"
        aria-label={`${state.name} color`}
        value={state.color}
        onChange={(e) => updateState(state.id, { color: e.currentTarget.value })}
      />
      <input
        class="input state-editor__name"
        aria-label="State name"
        value={state.name}
        onChange={(e) => e.currentTarget.value.trim() && updateState(state.id, { name: e.currentTarget.value.trim() })}
      />
      <label class="state-editor__closed" title="Todos here count as done">
        <input
          type="checkbox"
          class="state-editor__closed-box"
          checked={state.closed}
          onChange={(e) => updateState(state.id, { closed: e.currentTarget.checked })}
        />
        Closed
      </label>
      <IconButton label="Move up" class="btn--icon-xs" disabled={index === 0} onClick={() => moveState(state.id, -1)}>
        <ArrowUp />
      </IconButton>
      <IconButton
        label="Move down"
        class="btn--icon-xs"
        disabled={index === list.length - 1}
        onClick={() => moveState(state.id, 1)}
      >
        <ArrowDown />
      </IconButton>
      {confirming.value ? (
        <span class="state-editor__confirm">
          <button
            type="button"
            class="btn btn--destructive btn--xs"
            onClick={() => fallback && deleteState(state.id, fallback.id)}
          >
            {count ? `Delete, move ${count} to ${fallback?.name}` : 'Delete'}
          </button>
          <button type="button" class="btn btn--ghost btn--xs" onClick={() => (confirming.value = false)}>
            Keep
          </button>
        </span>
      ) : (
        <IconButton
          label="Delete state"
          class="btn--icon-xs btn--danger"
          disabled={list.length <= 1}
          onClick={() => (confirming.value = true)}
        >
          <Trash />
        </IconButton>
      )}
    </li>
  )
}

const SHORTCUTS: [string, string[][]][] = [
  [
    'Move around',
    [
      ['Next / previous to-do', 'J', 'K'],
      ['Previous / next column (board)', 'H', 'L'],
      ['Previous / next scope', '[', ']'],
      ['Open details (again: edit title)', '↵'],
      ['Close, clear, go back', 'Esc']
    ]
  ],
  [
    'Create and find',
    [
      ['New to-do', 'N'],
      ['Search', '/'],
      ['Switch list / board', 'V']
    ]
  ],
  [
    'Change the selected to-do',
    [
      ['Move to state 1–9', '1–9'],
      ['Move to previous / next state', '⇧H', '⇧L'],
      ['Mark done / reopen', 'X'],
      ['Cycle priority', 'P'],
      ['Edit description', 'E'],
      ['Archive / unarchive', 'A'],
      ['Delete', '⌫'],
      ['Undo delete', `${MOD}Z`]
    ]
  ]
]

function ShortcutsBody() {
  return (
    <div class="sheet__body shortcuts">
      {SHORTCUTS.map(([title, rows]) => (
        <section key={title} class="shortcuts__section">
          <h3 class="shortcuts__heading section-label">{title}</h3>
          <dl>
            {rows.map(([label, ...keys]) => (
              <div key={label} class="shortcuts__item">
                <dt>{label}</dt>
                <dd class="shortcuts__keys">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
