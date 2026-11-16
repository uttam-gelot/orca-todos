import { describe, expect, test } from 'bun:test'
import { DEFAULT_STATES, staleClosed, STATES_KEY, TODO_KEY } from '../../src/model'
import { DEFAULT_SETTINGS, parseSettings } from '../../src/settings'
import { autoArchive, followArchive } from '../../src/worker/archive'
import { makeTodo } from '../factories/todo'
import { createFakeWorkerOrca } from '../factories/worker-orca'

const DAY = 24 * 60 * 60 * 1000
const NOW = 100 * DAY

describe('staleClosed', () => {
  const todos = [
    makeTodo({ id: 'old', stateId: 'done', closedAt: NOW - 8 * DAY }),
    makeTodo({ id: 'edge', stateId: 'done', closedAt: NOW - 7 * DAY }),
    makeTodo({ id: 'fresh', stateId: 'done', closedAt: NOW - 6 * DAY }),
    makeTodo({ id: 'open', stateId: 'todo' }),
    makeTodo({ id: 'gone', stateId: 'done', closedAt: NOW - 30 * DAY, archived: true })
  ]

  test('picks live to-dos closed at least that many days ago', () => {
    expect(staleClosed(todos, DEFAULT_STATES, 7, NOW).map((t) => t.id)).toEqual(['old', 'edge'])
  })

  test('picks none when auto-archive is off', () => {
    expect(staleClosed(todos, DEFAULT_STATES, 0, NOW)).toEqual([])
  })
})

describe('parseSettings', () => {
  test('keeps allowed values and defaults the rest', () => {
    expect(parseSettings({ autoArchiveDays: 7, language: 'de' })).toMatchObject({ autoArchiveDays: 7, language: 'de' })
    expect(parseSettings({ autoArchiveDays: 5, language: 3 })).toMatchObject({ autoArchiveDays: 0, language: 'auto' })
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
  })
})

describe('autoArchive', () => {
  const seed = () => {
    const orca = createFakeWorkerOrca()
    orca.stored.set(STATES_KEY, DEFAULT_STATES)
    orca.stored.set(TODO_KEY + 'old', makeTodo({ id: 'old', stateId: 'done', closedAt: NOW - 3 * DAY }))
    orca.stored.set(TODO_KEY + 'new', makeTodo({ id: 'new', stateId: 'done', closedAt: NOW - DAY / 2 }))
    return orca
  }

  test('archives closed to-dos older than the setting, and only those', async () => {
    const orca = seed()
    orca.setting.set('autoArchiveDays', 1)
    expect(await autoArchive(orca, NOW)).toBe(1)
    expect(orca.stored.get(TODO_KEY + 'old')).toMatchObject({ archived: true, updatedAt: NOW })
    expect(orca.stored.get(TODO_KEY + 'new')).toMatchObject({ archived: false })
    expect(orca.logs).toEqual(['Auto-archived 1 closed to-dos'])
  })

  test('does nothing while the setting is Never', async () => {
    const orca = seed()
    expect(await autoArchive(orca, NOW)).toBe(0)
    expect(orca.calls.some((c) => c.method === 'storage.set')).toBe(false)
  })

  test('uses the defaults when Orca will not read settings', async () => {
    const orca = seed()
    orca.settings.get = () => Promise.reject(Object.assign(new Error('no'), { code: 'not_permitted' }))
    expect(await autoArchive(orca, NOW)).toBe(0)
    expect(orca.logs).toEqual(['Could not read settings; using the defaults (not_permitted)'])
  })
})

describe('followArchive', () => {
  test('runs again when a setting changes', async () => {
    const orca = createFakeWorkerOrca()
    orca.stored.set(TODO_KEY + 'a', makeTodo({ id: 'a', stateId: 'done', closedAt: 0 }))
    const follow = followArchive(orca)
    await Bun.sleep(1)
    expect(orca.stored.get(TODO_KEY + 'a')).toMatchObject({ archived: false })
    orca.changeSetting('autoArchiveDays', 1)
    await Bun.sleep(1)
    expect(orca.stored.get(TODO_KEY + 'a')).toMatchObject({ archived: true })
    follow.dispose()
  })
})
