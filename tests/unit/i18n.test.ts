import { describe, expect, test } from 'bun:test'
import { LANGUAGES, messagesFor, resolveLang, type Lang } from '../../src/i18n'
import { en } from '../../src/i18n/en'

describe('resolveLang', () => {
  test('follows Orca’s locale when the setting is auto', () => {
    expect(resolveLang('auto', 'en-US')).toBe('en')
  })

  test('falls back to English for a language it does not speak', () => {
    expect(resolveLang('auto', 'sw-KE')).toBe('en')
    expect(resolveLang('auto', undefined)).toBe('en')
    expect(resolveLang('auto', '')).toBe('en')
  })

  test('ignores a stored language that no longer ships', () => {
    expect(resolveLang('xx', 'en-GB')).toBe('en')
  })
})

describe('catalogs', () => {
  test('every language has every message, of the same kind as English', () => {
    for (const lang of Object.keys(LANGUAGES) as Lang[]) {
      const m = messagesFor(lang)
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect([lang, key, typeof m[key]]).toEqual([lang, key, typeof en[key]])
      }
    }
  })

  test('messages that take values fill them in', () => {
    expect(en.addTo('Done')).toBe('Add to Done')
    expect(en.archivedClosed(1)).toBe('Archived 1 closed to-do')
    expect(en.archivedClosed(3)).toBe('Archived 3 closed to-dos')
  })
})
