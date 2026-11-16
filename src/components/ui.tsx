// Small shared primitives: icons for state and priority, buttons, shortcut chips, sheets, time.

import type { ButtonHTMLAttributes, ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Circle, CircleCheck, SignalHigh, SignalLow, SignalMedium, X } from 'lucide-preact'
import { PRIORITY_LABEL, type Priority, type State } from '../model'
import './ui.css'

export const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
export const MOD = isMac ? '⌘' : 'Ctrl'

export function StateIcon({ state }: { state?: State }) {
  const Icon = state?.closed ? CircleCheck : Circle
  return <Icon class="state-icon" style={{ color: state?.color }} aria-hidden="true" />
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  if (priority === 'none') return <span class="prio prio--none" aria-hidden="true" />
  const Icon = { low: SignalLow, med: SignalMedium, high: SignalHigh }[priority]
  return (
    <span class={`prio prio--${priority}`} title={`${PRIORITY_LABEL[priority]} priority`}>
      <Icon aria-hidden="true" />
    </span>
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
      <IconButton label="Close" onClick={onClose}>
        <X />
      </IconButton>
    </header>
  )
}

const UNITS: [number, string][] = [
  [60, 's'],
  [60, 'm'],
  [24, 'h'],
  [7, 'd'],
  [4.35, 'w'],
  [12, 'mo'],
  [Infinity, 'y']
]

/** Compact age: "now", "5m", "3d". */
export function ago(ts: number, now = Date.now()): string {
  let n = Math.max(0, (now - ts) / 1000)
  if (n < 60) return 'now'
  for (const [size, unit] of UNITS) {
    if (n < size) return `${Math.floor(n)}${unit}`
    n /= size
  }
  return ''
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
})
export const formatDate = (ts: number): string => dateFormat.format(ts)
