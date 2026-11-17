import { describe, expect, test } from 'bun:test'
import { remindAt } from '../../src/due'
import { DEFAULT_STATES, STATES_KEY, TODO_KEY } from '../../src/model'
import { parseSettings } from '../../src/settings'
import { notificationsFor, REMINDERS_KEY, remind } from '../../src/worker/reminders'
import { makeTodo } from '../factories/todo'
import { createFakeWorkerOrca } from '../factories/worker-orca'

// Wednesday 2026-03-04, 10:00 local time.
const NOW = new Date(2026, 2, 4, 10, 0).getTime()
const HOUR = 60 * 60 * 1000

const seed = (...todos: ReturnType<typeof makeTodo>[]) => {
  const orca = createFakeWorkerOrca({ 'notifications.show': () => ({ delivered: true }) })
  orca.stored.set(STATES_KEY, DEFAULT_STATES)
  for (const todo of todos) orca.stored.set(TODO_KEY + todo.id, todo)
  return orca
}
const shown = (orca: ReturnType<typeof seed>) =>
  orca.calls.filter((c) => c.method === 'notifications.show').map((c) => c.params)

describe('remindAt', () => {
  test('a time is reminded then, a day at the reminder time', () => {
    expect(remindAt('2026-03-04T15:30', '09:00')).toBe(new Date(2026, 2, 4, 15, 30).getTime())
    expect(remindAt('2026-03-04', '09:00')).toBe(new Date(2026, 2, 4, 9, 0).getTime())
  })
})

describe('parseSettings', () => {
  test('reads the reminder settings and defaults bad values', () => {
    expect(parseSettings({ dueReminders: false, reminderTime: '07:00' })).toMatchObject({
      dueReminders: false,
      reminderTime: '07:00'
    })
    expect(parseSettings({ dueReminders: 'yes', reminderTime: '06:00' })).toMatchObject({
      dueReminders: true,
      reminderTime: '09:00'
    })
  })
})

describe('remind', () => {
  test('notifies once for each to-do that came due, and records it', async () => {
    const orca = seed(
      makeTodo({ id: 'day', title: 'Ship it', due: '2026-03-04' }),
      makeTodo({ id: 'time', title: 'Call', due: '2026-03-04T09:30' }),
      makeTodo({ id: 'later', due: '2026-03-04T11:00' })
    )
    expect(await remind(orca, NOW)).toBe(2)
    expect(shown(orca)).toEqual([
      { title: 'Due today', body: 'Ship it' },
      { title: 'Due now', body: 'Call' }
    ])
    expect(orca.stored.get(REMINDERS_KEY)).toEqual({ day: '2026-03-04', time: '2026-03-04T09:30' })
    expect(await remind(orca, NOW + 60_000)).toBe(0)
  })

  test('reminds again after the due changes', async () => {
    const orca = seed(makeTodo({ id: 'a', due: '2026-03-04T09:30' }))
    await remind(orca, NOW)
    orca.stored.set(TODO_KEY + 'a', makeTodo({ id: 'a', due: '2026-03-04T10:30' }))
    expect(await remind(orca, NOW + HOUR)).toBe(1)
  })

  test('records a long-missed reminder without a notification', async () => {
    const orca = seed(makeTodo({ id: 'old', due: '2026-02-01' }))
    expect(await remind(orca, NOW)).toBe(0)
    expect(shown(orca)).toEqual([])
    expect(orca.stored.get(REMINDERS_KEY)).toEqual({ old: '2026-02-01' })
  })

  test('skips closed and archived to-dos, and forgets them', async () => {
    const orca = seed(
      makeTodo({ id: 'done', stateId: 'done', due: '2026-03-04' }),
      makeTodo({ id: 'gone', archived: true, due: '2026-03-04' })
    )
    orca.stored.set(REMINDERS_KEY, { done: '2026-03-04', missing: '2026-01-01' })
    expect(await remind(orca, NOW)).toBe(0)
    expect(orca.stored.get(REMINDERS_KEY)).toEqual({})
  })

  test('does nothing while reminders are off', async () => {
    const orca = seed(makeTodo({ id: 'a', due: '2026-03-04' }))
    orca.setting.set('dueReminders', false)
    expect(await remind(orca, NOW)).toBe(0)
    expect(orca.calls.some((c) => c.method === 'storage.set')).toBe(false)
  })

  test('still records the reminder when Orca will not show it', async () => {
    const orca = seed(makeTodo({ id: 'a', due: '2026-03-04' }))
    orca.answers.delete('notifications.show')
    expect(await remind(orca, NOW)).toBe(1)
    expect(orca.logs).toContain('Could not show a due reminder (not_permitted)')
    expect(orca.stored.get(REMINDERS_KEY)).toEqual({ a: '2026-03-04' })
  })
})

describe('notificationsFor', () => {
  test('groups many to-dos coming due together into one', () => {
    const due = ['a', 'b', 'c', 'd'].map((id) => makeTodo({ id, title: id.toUpperCase(), due: '2026-03-04' }))
    expect(notificationsFor(due)).toEqual([{ title: '4 to-dos are due', body: 'A, B, C, D' }])
  })
})
