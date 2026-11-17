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

  test('picks the closest language it speaks', () => {
    expect(resolveLang('auto', 'es-MX')).toBe('es')
    expect(resolveLang('auto', 'fr-CA')).toBe('fr')
    expect(resolveLang('auto', 'de')).toBe('de')
    expect(resolveLang('auto', 'ja-JP')).toBe('ja')
    expect(resolveLang('auto', 'zh-Hans-CN')).toBe('zh-CN')
    expect(resolveLang('auto', 'zh')).toBe('zh-CN')
  })

  test('reads traditional Chinese as English, since only simplified ships', () => {
    expect(resolveLang('auto', 'zh-TW')).toBe('en')
    expect(resolveLang('auto', 'zh-Hant')).toBe('en')
  })

  test('the setting wins over Orca’s locale', () => {
    expect(resolveLang('ja', 'en-US')).toBe('ja')
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
    expect(messagesFor('es').archivedClosed(1)).toBe('Se archivó 1 tarea cerrada')
    expect(messagesFor('de').statusOpen(2, 1, 0)).toBe('2 offen · 1 hoch')
  })

  test('no translation is left in English', () => {
    for (const lang of Object.keys(LANGUAGES) as Lang[]) {
      if (lang === 'en') continue
      const m = messagesFor(lang)
      expect([lang, m.allTodos]).not.toEqual([lang, en.allTodos])
      expect([lang, m.searchPlaceholder]).not.toEqual([lang, en.searchPlaceholder])
    }
  })
})
