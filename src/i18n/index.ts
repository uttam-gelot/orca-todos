// The languages the interface speaks, and which one to use. Pure, so the worker shares it: the
// panel and tab read Orca's locale from their frame, and the worker reads the copy they store.

import { de } from './de'
import { en, type Messages } from './en'
import { es } from './es'
import { fr } from './fr'
import { ja } from './ja'
import { zhCN } from './zh-CN'

export type { Messages } from './en'

/** The storage key where the panel keeps Orca's locale for the worker, which cannot read it. */
export const LOCALE_KEY = 'locale'

/** Each language by its tag, named in itself, in the order Settings lists them. */
export const LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  'zh-CN': '简体中文'
} as const satisfies Record<string, string>

export type Lang = keyof typeof LANGUAGES

const CATALOGS: Record<Lang, Messages> = { en, es, fr, de, ja, 'zh-CN': zhCN }

const isLang = (tag: string): tag is Lang => Object.hasOwn(LANGUAGES, tag)

/**
 * The language to show: the one picked in Settings, else the closest to Orca's locale (`es-MX`
 * reads Spanish, `zh-Hans-CN` simplified Chinese), else English.
 */
export function resolveLang(setting: string, locale: string | undefined): Lang {
  if (isLang(setting)) return setting
  const tag = (locale ?? '').trim()
  if (isLang(tag)) return tag
  const [base, ...rest] = tag.split('-')
  const lower = base.toLowerCase()
  if (lower === 'zh') {
    // Only simplified Chinese ships; traditional regions and scripts fall back to English.
    const traditional = rest.some((part) => /^(Hant|TW|HK|MO)$/i.test(part))
    return traditional ? 'en' : 'zh-CN'
  }
  return isLang(lower) ? lower : 'en'
}

export const messagesFor = (lang: Lang): Messages => CATALOGS[lang]
