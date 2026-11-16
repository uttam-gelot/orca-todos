// Due dates: pure rules for reading, comparing and naming them. No DOM and no Orca, so the panel
// and the worker (reminders, the status bar count) share them.
//
// A due date is local wall-clock time, stored as text so it means the same day wherever Orca runs:
// `2026-03-04` (a day) or `2026-03-04T15:30` (a day and a time). A day with no time is due by the
// end of that day.

import type { Messages } from './i18n/en'

const DUE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/
const DAY_MS = 24 * 60 * 60 * 1000

/** The due text when it names a real date (and time), else null. */
export function parseDue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const m = DUE.exec(value)
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map((part) => Number(part ?? 0))
  // Date rolls an impossible day over (Feb 30 → Mar 2), so a real date reads back the same.
  const date = new Date(y, mo - 1, d)
  const real = date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d && h < 24 && mi < 60
  return real ? value : null
}

/** Whether the due has a time of day, not only a day. */
export const hasTime = (due: string): boolean => due.length > 10

const pad = (n: number): string => String(n).padStart(2, '0')

/** A local date as due text: `2026-03-04`. */
export const dayText = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** The day part of a due: `2026-03-04`. */
export const dueDay = (due: string): string => due.slice(0, 10)

/** The time part of a due (`15:30`), or '' for a day. */
export const dueTime = (due: string): string => (hasTime(due) ? due.slice(11, 16) : '')

/** Joins a day and an optional time into due text. */
export const joinDue = (day: string, time: string): string => (time ? `${day}T${time}` : day)

/** The local start of the due's day, as a timestamp. */
export function dayStart(due: string): number {
  const [y, m, d] = dueDay(due).split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

/** When the to-do is due: the time it names, or the end of its day. */
export function dueAt(due: string): number {
  if (!hasTime(due)) return dayStart(due) + DAY_MS - 1
  const [h, mi] = dueTime(due).split(':').map(Number)
  const [y, m, d] = dueDay(due).split('-').map(Number)
  return new Date(y, m - 1, d, h, mi).getTime()
}

/** Whole local days from `now`'s day to the due's day: 0 today, 1 tomorrow, -1 yesterday. */
export function daysUntil(due: string, now: number): number {
  const today = new Date(now)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  // Rounding absorbs the hour a daylight-saving change adds or removes.
  return Math.round((dayStart(due) - start) / DAY_MS)
}

/** How urgent a due is: past, today, within the week, or later. */
export type DueState = 'overdue' | 'today' | 'soon' | 'later'

export function dueState(due: string, now: number): DueState {
  if (dueAt(due) < now) return 'overdue'
  const days = daysUntil(due, now)
  if (days <= 0) return 'today'
  return days < 7 ? 'soon' : 'later'
}

/**
 * How a due reads on a row or card, in the language `lang` with the words of `m`: "Today",
 * "Tomorrow 15:30", "Fri", "Mar 4", "Mar 4, 2027". Short on purpose; the tooltip has the full date.
 */
export function dueLabel(due: string, now: number, lang: string, m: Messages): string {
  const days = daysUntil(due, now)
  const date = new Date(dayStart(due))
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  const day =
    days === 0
      ? m.dueToday
      : days === 1
        ? m.dueTomorrow
        : days === -1
          ? m.dueYesterday
          : days > 1 && days < 7
            ? new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(date)
            : new Intl.DateTimeFormat(lang, {
                month: 'short',
                day: 'numeric',
                ...(!sameYear && { year: 'numeric' })
              }).format(date)
  if (!hasTime(due)) return day
  const time = new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit' }).format(dueAt(due))
  return `${day} ${time}`
}

/** A due in full, for tooltips and screen readers: "Friday, March 4, 2026 at 3:30 PM". */
export function dueFull(due: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    dateStyle: 'full',
    ...(hasTime(due) && { timeStyle: 'short' })
  }).format(hasTime(due) ? dueAt(due) : dayStart(due))
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * A quick-add due word, without its `@`: `today`, `tomorrow` (or `tmr`), a weekday such as `fri`
 * or `friday` (the next one, never today), or a date such as `2026-03-04`. Null for anything else,
 * so `@alex` stays in the title.
 */
export function quickDue(word: string, now: number): string | null {
  const w = word.toLowerCase()
  const today = new Date(now)
  const inDays = (n: number) => dayText(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n))
  if (w === 'today') return inDays(0)
  if (w === 'tomorrow' || w === 'tmr') return inDays(1)
  const weekday = WEEKDAYS.findIndex((d, i) => w === d || w === DAY_NAMES[i])
  if (weekday >= 0) return inDays(((weekday - today.getDay() + 6) % 7) + 1)
  return parseDue(w) && !hasTime(w) ? w : null
}

/** Orders by due, soonest first; to-dos with no due come last, in their given order. */
export function compareDue(a: string | undefined, b: string | undefined): number {
  if (a && b) return dueAt(a) - dueAt(b)
  return a ? -1 : b ? 1 : 0
}
