// The interface text for the panel and the tab: `t.someKey`, or `t.someKey(value)` for messages
// that take values. Reading `t` inside a component subscribes it, so a language change re-renders.

import { computed, signal } from '@preact/signals'
import { log } from '../log'
import { orcaLocale, settings, storage } from '../orca'
import { parseSettings } from '../settings'
import { LOCALE_KEY, messagesFor, resolveLang, type Lang, type Messages } from '.'

/** The language setting: `auto` or a language tag. */
export const languageSetting = signal('auto')

export const lang = computed<Lang>(() => resolveLang(languageSetting.value, orcaLocale()))

const messages = computed(() => messagesFor(lang.value))

async function readLanguage(): Promise<void> {
  if (!settings) return
  try {
    languageSetting.value = parseSettings(await settings.get()).language
  } catch (error) {
    log.warn('Could not read the language setting; following Orca', { op: 'readSettings' }, error)
  }
}

/**
 * Reads the language setting and follows changes to it. Also stores Orca's locale for the worker,
 * which has no locale of its own but writes the status bar and notifications. Never rejects.
 */
export async function followLanguage(): Promise<void> {
  await readLanguage()
  settings?.onDidChange(() => void readLanguage())
  const locale = orcaLocale()
  try {
    if ((await storage.get(LOCALE_KEY)) !== locale) await storage.set(LOCALE_KEY, locale)
  } catch (error) {
    log.warn('Could not store the locale for the worker', { op: 'write', key: LOCALE_KEY }, error)
  }
}

export const t: Messages = new Proxy({} as Messages, {
  get: (_, key) => messages.value[key as keyof Messages]
})

const formats = computed(() => ({
  date: new Intl.DateTimeFormat(lang.value, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  long: new Intl.DateTimeFormat(lang.value, { dateStyle: 'medium', timeStyle: 'short' })
}))

/** A time as "Mar 4, 3:05 PM", in the interface language. */
export const formatDate = (ts: number): string => formats.value.date.format(ts)

/** A time in full, for tooltips. */
export const formatLong = (ts: number): string => formats.value.long.format(ts)
