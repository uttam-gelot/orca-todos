import { beforeEach, describe, expect, test } from 'bun:test'
import { LOCALE_KEY } from '../../src/i18n'
import { followLanguage, lang, t } from '../../src/i18n/t'
import { STATES_KEY } from '../../src/model'
import { load, states } from '../../src/store'
import { resetStore } from '../factories/store'
import { fakeOrca } from '../setup'

beforeEach(() => {
  fakeOrca.reset()
  resetStore()
})

describe('followLanguage', () => {
  test('speaks the language picked in Settings', async () => {
    fakeOrca.settingValues.language = 'fr'
    await followLanguage()
    expect(lang.value).toBe('fr')
    expect(t.allTodos).toBe('Toutes les tâches')
  })

  test('follows a change made in Settings', async () => {
    await followLanguage()
    fakeOrca.setSetting('language', 'de')
    await Bun.sleep(1)
    expect(t.allTodos).toBe('Alle Aufgaben')
  })

  test('stores Orca’s locale for the worker', async () => {
    await followLanguage()
    expect(typeof fakeOrca.data.get(LOCALE_KEY)).toBe('string')
  })
})

describe('first run', () => {
  test('names the default states in the interface language', async () => {
    fakeOrca.settingValues.language = 'es'
    await followLanguage()
    await load()
    expect(states.value.map((s) => s.name)).toEqual(['Pendientes', 'Por hacer', 'En curso', 'Hecho'])
    expect((fakeOrca.data.get(STATES_KEY) as { name: string }[])[0].name).toBe('Pendientes')
  })
})
