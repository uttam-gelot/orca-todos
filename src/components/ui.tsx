// Small shared primitives: icons for state and priority, buttons, shortcut chips, sheets, time.

import type { ButtonHTMLAttributes, ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import {
  CalendarClock,
  Circle,
  CircleCheck,
  FolderGit2,
  ListChecks,
  NotepadText,
  SignalHigh,
  SignalLow,
  SignalMedium,
  X
} from 'lucide-preact'
import { dueFull, dueLabel, dueState } from '../due'
import { lang, t } from '../i18n/t'
import { filter, now, openProject } from '../store'
import { checklist, type Priority, type State } from '../model'
import './ui.css'

export const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
export const MOD = isMac ? '⌘' : 'Ctrl'

export function StateIcon({ state }: { state?: State }) {
  const Icon = state?.closed ? CircleCheck : Circle
  return <Icon class="state-icon" style={{ color: state?.color }} aria-hidden="true" />
}

/** The state icon as a button that marks the to-do done, or reopens it. Used on rows and cards. */
export function DoneToggle({ state, onToggle, class: cls }: { state?: State; onToggle: () => void; class?: string }) {
  const label = state?.closed ? t.reopen : t.markDone
  return (
    <button
      type="button"
      class={['done-toggle', cls].filter(Boolean).join(' ')}
      aria-label={label}
      title={`${label} (X)`}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
    >
      <StateIcon state={state} />
    </button>
  )
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  if (priority === 'none') return <span class="prio prio--none" aria-hidden="true" />
  const Icon = { low: SignalLow, med: SignalMedium, high: SignalHigh }[priority]
  return (
    <span class={`prio prio--${priority}`} title={t.priorityTitle(t.priorities[priority])}>
      <Icon aria-hidden="true" />
    </span>
  )
}

/**
 * What the notes hold, on a row or card: checklist progress such as `2/5` when they hold task
 * items, else a note icon when they hold anything. Nothing for empty notes.
 */
export function NotesHint({ description, class: cls }: { description: string; class?: string }) {
  const { done, total } = checklist(description)
  if (total) {
    const summary = t.checklistSummary(done, total)
    return (
      <span class={['checklist', done === total && 'checklist--done', cls].filter(Boolean).join(' ')} title={summary}>
        <ListChecks aria-hidden="true" />
        <span aria-hidden="true">
          {done}/{total}
        </span>
        <span class="sr-only">{summary}</span>
      </span>
    )
  }
  if (!description.trim()) return null
  return (
    <span class={['notes-hint', cls].filter(Boolean).join(' ')} title={t.hasNotes}>
      <NotepadText aria-hidden="true" />
      <span class="sr-only">{t.hasNotes}</span>
    </span>
  )
}

/**
 * When a to-do is due, as "Today", "Fri" or "Mar 4". Past due reads in the destructive color and
 * due today in amber, unless the to-do is closed: then it is only a quiet date.
 */
export function DueChip({ due, closed, class: cls }: { due: string; closed?: boolean; class?: string }) {
  const state = dueState(due, now.value)
  const tone = closed ? 'closed' : state
  const summary = t.dueTitle(dueFull(due, lang.value), !closed && state === 'overdue')
  return (
    <span class={['due', `due--${tone}`, cls].filter(Boolean).join(' ')} title={summary}>
      <CalendarClock aria-hidden="true" />
      <span class="due__label" aria-hidden="true">
        {dueLabel(due, now.value, lang.value, t)}
      </span>
      <span class="sr-only">{summary}</span>
    </span>
  )
}

/**
 * The to-do's project, as a chip that opens the project's workspace in Orca. Hidden while the list
 * is already scoped to that project.
 */
export function ProjectChip({ project }: { project?: string }) {
  if (!project || filter.value.project === project) return null
  return (
    <button
      type="button"
      class="project-chip"
      title={t.openProject(project)}
      aria-label={t.openProject(project)}
      onClick={(e) => {
        e.stopPropagation()
        void openProject(project)
      }}
    >
      <FolderGit2 aria-hidden="true" />
      <span class="project-chip__name">{project}</span>
    </button>
  )
}

/** A key chip. `small` fits it inside an extra-small button; `class` mixes in a parent element. */
export function Kbd({ children, small, class: cls }: { children: ComponentChildren; small?: boolean; class?: string }) {
  return <kbd class={['kbd', small && 'kbd--sm', cls].filter(Boolean).join(' ')}>{children}</kbd>
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ComponentChildren }

/** An icon-only button; its label is both the accessible name and the tooltip. */
export function IconButton({ label, children, class: cls, ...rest }: IconButtonProps) {
  return (
    <button type="button" class={`btn btn--ghost btn--icon ${cls ?? ''}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  )
}

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'

/** Keeps Tab inside `panel`: from the last control it goes to the first, and back. */
function trapTab(e: KeyboardEvent, panel: HTMLElement): void {
  const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  const edge = e.shiftKey ? first : last
  if (document.activeElement !== edge) return
  e.preventDefault()
  ;(e.shiftKey ? last : first).focus()
}

/**
 * A modal edge panel, or with `center` a dialog in the middle (as Orca's composer opens). Esc and
 * the scrim close it, Tab stays inside it, and focus returns to where it was.
 */
export function Sheet({
  label,
  onClose,
  center,
  children
}: {
  label: string
  onClose: () => void
  center?: boolean
  children: ComponentChildren
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const panel = ref.current
    const first = panel?.querySelector<HTMLElement>('[autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    return () => before?.focus?.()
  }, [])
  return (
    <div class={center ? 'sheet sheet--center' : 'sheet'}>
      <div class="sheet__scrim" onClick={onClose} />
      <div
        ref={ref}
        class={center ? 'sheet__panel sheet__panel--center' : 'sheet__panel'}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === 'Tab') trapTab(e, e.currentTarget)
          if (e.key === 'Escape' && !e.defaultPrevented) {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header class="sheet__head">
      <h2 class="sheet__title">{title}</h2>
      <IconButton label={t.close} onClick={onClose}>
        <X />
      </IconButton>
    </header>
  )
}

const UNITS: [number, keyof typeof t.ago][] = [
  [60, 's'],
  [60, 'm'],
  [24, 'h'],
  [7, 'd'],
  [4.35, 'w'],
  [12, 'mo'],
  [Infinity, 'y']
]

/** Compact age: "now", "5m", "3d", with the units of the interface language. */
export function ago(ts: number, now = Date.now()): string {
  let n = Math.max(0, (now - ts) / 1000)
  if (n < 60) return t.agoNow
  for (const [size, unit] of UNITS) {
    if (n < size) return `${Math.floor(n)}${t.ago[unit]}`
    n /= size
  }
  return ''
}
