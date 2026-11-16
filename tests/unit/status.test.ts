import { describe, expect, test } from 'bun:test'
import { DEFAULT_STATES, STATES_KEY, TODO_KEY } from '../../src/model'
import { followStatus, STATUS_ITEM, statusFor, updateStatus } from '../../src/worker/status'
import { makeTodo } from '../factories/todo'
import { createFakeWorkerOrca } from '../factories/worker-orca'

const updates = (orca: ReturnType<typeof createFakeWorkerOrca>) =>
  orca.calls.filter((c) => c.method === 'statusBar.update').map((c) => c.params)

const withStatusBar = () => createFakeWorkerOrca({ 'statusBar.update': () => ({ ok: true }) })

describe('statusFor', () => {
  test('counts open to-dos and the high-priority ones among them', () => {
    const todos = [
      makeTodo({ id: 'a', priority: 'high' }),
      makeTodo({ id: 'b' }),
      makeTodo({ id: 'c', stateId: 'done', priority: 'high' }),
      makeTodo({ id: 'd', archived: true, priority: 'high' })
    ]
    expect(statusFor(todos, DEFAULT_STATES).text).toBe('2 open · 1 high')
    expect(statusFor(todos, DEFAULT_STATES).tooltip).toStartWith('ToDos: 2 open to-dos, 1 high priority.')
  })

  test('says so when nothing is open', () => {
    expect(statusFor([makeTodo({ stateId: 'done' })], DEFAULT_STATES).text).toBe('No open to-dos')
  })

  test('leaves out the high count when there is none', () => {
    expect(statusFor([makeTodo()], DEFAULT_STATES).text).toBe('1 open')
  })

  test('counts open to-dos past their due', () => {
    const todos = [makeTodo({ id: 'a', due: '2020-01-01' }), makeTodo({ id: 'b', due: '2020-01-01', stateId: 'done' })]
    const status = statusFor(todos, DEFAULT_STATES)
    expect(status.text).toBe('1 open · 1 overdue')
    expect(status.tooltip).toStartWith('ToDos: 1 open to-do, 1 overdue.')
  })
})

describe('updateStatus', () => {
  test('reads valid to-dos from storage and skips the rest', async () => {
    const orca = withStatusBar()
    orca.stored.set(TODO_KEY + 'a', makeTodo({ id: 'a', priority: 'high' }))
    orca.stored.set(TODO_KEY + 'b', { title: 42 })
    orca.stored.set(STATES_KEY, DEFAULT_STATES)
    await updateStatus(orca)
    expect(updates(orca)).toEqual([
      { id: STATUS_ITEM, text: '1 open · 1 high', tooltip: expect.any(String), visible: true }
    ])
  })
})

describe('followStatus', () => {
  test('counts once now and once after a burst of to-do writes', async () => {
    const orca = withStatusBar()
    followStatus(orca, 5)
    await Bun.sleep(1)
    expect(updates(orca)).toHaveLength(1)
    orca.stored.set(TODO_KEY + 'a', makeTodo())
    orca.changeStorage(TODO_KEY + 'a')
    orca.changeStorage(TODO_KEY + 'a')
    orca.changeStorage('runs')
    await Bun.sleep(20)
    expect(updates(orca)).toHaveLength(2)
    expect(updates(orca)[1]).toMatchObject({ text: '1 open' })
  })

  test('logs only the error code when Orca refuses the update', async () => {
    const orca = createFakeWorkerOrca()
    followStatus(orca, 5)
    await Bun.sleep(1)
    expect(orca.logs).toEqual(['Could not update the status bar item (not_permitted)'])
  })
})

describe('the status language', () => {
  test('follows the language setting', async () => {
    const orca = withStatusBar()
    orca.setting.set('language', 'de')
    orca.stored.set(TODO_KEY + 'a', makeTodo({ id: 'a' }))
    await updateStatus(orca)
    expect(updates(orca)[0]).toMatchObject({ text: '1 offen' })
  })

  test('follows the locale a panel stored when the setting is auto', async () => {
    const orca = withStatusBar()
    orca.stored.set('locale', 'es-ES')
    await updateStatus(orca)
    expect(updates(orca)[0]).toMatchObject({ text: 'No hay tareas abiertas' })
  })
})
