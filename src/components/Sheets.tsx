// Edge sheets: managing states, and the keyboard shortcut list.

import { useSignal } from '@preact/signals'
import { ArrowDown, ArrowUp, Trash } from 'lucide-preact'
import type { State } from '../model'
import { addState, deleteState, moveState, sheet, states, summary, updateState } from '../store'
import { t } from '../i18n/t'
import { IconButton, Kbd, MOD, Sheet, SheetHeader } from './ui'
import './Sheets.css'

const close = () => (sheet.value = null)

export function Sheets() {
  if (sheet.value === 'states')
    return (
      <Sheet label={t.states} onClose={close}>
        <SheetHeader title={t.states} onClose={close} />
        <StatesBody />
      </Sheet>
    )
  if (sheet.value === 'shortcuts')
    return (
      <Sheet label={t.keyboardShortcuts} onClose={close}>
        <SheetHeader title={t.keyboardShortcuts} onClose={close} />
        <ShortcutsBody />
      </Sheet>
    )
  return null
}

function StatesBody() {
  const name = useSignal('')
  return (
    <div class="sheet__body state-editor">
      <p class="sheet__hint">{t.statesHint}</p>
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
          placeholder={t.newStateName}
          aria-label={t.newStateName}
          value={name.value}
          onInput={(e) => (name.value = e.currentTarget.value)}
        />
        <button type="submit" class="btn btn--outline btn--sm" disabled={!name.value.trim()}>
          {t.addState}
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
        aria-label={t.stateColor(state.name)}
        value={state.color}
        onChange={(e) => updateState(state.id, { color: e.currentTarget.value })}
      />
      <input
        class="input state-editor__name"
        aria-label={t.stateName}
        value={state.name}
        onChange={(e) => e.currentTarget.value.trim() && updateState(state.id, { name: e.currentTarget.value.trim() })}
      />
      <label class="state-editor__closed" title={t.closedHint}>
        <input
          type="checkbox"
          class="state-editor__closed-box"
          checked={state.closed}
          onChange={(e) => updateState(state.id, { closed: e.currentTarget.checked })}
        />
        {t.closedLabel}
      </label>
      <IconButton label={t.moveUp} class="btn--icon-xs" disabled={index === 0} onClick={() => moveState(state.id, -1)}>
        <ArrowUp />
      </IconButton>
      <IconButton
        label={t.moveDown}
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
            {count ? t.deleteAndMove(count, fallback?.name ?? '') : t.delete}
          </button>
          <button type="button" class="btn btn--ghost btn--xs" onClick={() => (confirming.value = false)}>
            {t.keep}
          </button>
        </span>
      ) : (
        <IconButton
          label={t.deleteState}
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

/** The shortcut list: sections of [label, ...keys], in the interface language. */
const shortcuts = (): [string, string[][]][] => [
  [
    t.keysMove,
    [
      [t.keysNextPrev, 'J', 'K'],
      [t.keysColumns, 'H', 'L'],
      [t.keysScopes, '[', ']'],
      [t.keysOpen, '↵'],
      [t.keysBack, 'Esc']
    ]
  ],
  [
    t.keysCreate,
    [
      [t.keysNew, 'N'],
      [t.keysSearch, '/'],
      [t.keysView, 'V']
    ]
  ],
  [
    t.keysChange,
    [
      [t.keysToState, '1–9'],
      [t.keysShiftState, '⇧H', '⇧L'],
      [t.keysDone, 'X'],
      [t.keysPriority, 'P'],
      [t.keysNotes, 'E'],
      [t.keysAgent, 'S'],
      [t.keysOpenRun, 'O'],
      [t.keysCopy, 'Y'],
      [t.keysArchive, 'A'],
      [t.keysDelete, '⌫'],
      [t.keysUndo, `${MOD}Z`]
    ]
  ]
]

function ShortcutsBody() {
  return (
    <div class="sheet__body shortcuts">
      {shortcuts().map(([title, rows]) => (
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
