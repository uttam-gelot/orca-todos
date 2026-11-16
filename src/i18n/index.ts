// The languages the interface speaks, and which one to use. Pure, so the worker shares it: the
// panel and tab read Orca's locale from their frame, and the worker reads the copy they store.

import { en, type Messages } from './en'

export type { Messages } from './en'

/** Each language by its tag, named in itself, in the order Settings lists them. */
export const LANGUAGES = { en: 'English' } as const satisfies Record<string, string>

export type Lang = keyof typeof LANGUAGES

const CATALOGS: Record<Lang, Messages> = { en }

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
    const simplified: string = 'zh-CN'
    return !traditional && isLang(simplified) ? simplified : 'en'
  }
  return isLang(lower) ? lower : 'en'
}

export const messagesFor = (lang: Lang): Messages => CATALOGS[lang]
