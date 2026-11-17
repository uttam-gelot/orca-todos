import { describe, expect, test } from 'bun:test'
import { compareDue, dueAt, dueLabel, dueState, parseDue, quickDue } from '../../src/due'
import { en } from '../../src/i18n/en'

// Wednesday 2026-03-04, 10:00 local time.
const NOW = new Date(2026, 2, 4, 10, 0).getTime()

describe('parseDue', () => {
  test('keeps a real day, or a day and a time', () => {
    expect(parseDue('2026-03-04')).toBe('2026-03-04')
    expect(parseDue('2026-03-04T15:30')).toBe('2026-03-04T15:30')
  })

  test('drops impossible dates and anything else', () => {
    for (const bad of [
      '2026-02-30',
      '2026-13-01',
      '2026-03-04T24:00',
      '2026-03-04T10:60',
      '4 Mar',
      '',
      20260304,
      null
    ]) {
      expect(parseDue(bad)).toBeNull()
    }
  })
})

describe('dueState', () => {
  test('a day is due by its end, so today is not yet overdue', () => {
    expect(dueState('2026-03-04', NOW)).toBe('today')
    expect(dueState('2026-03-03', NOW)).toBe('overdue')
  })

  test('a time is due at that minute', () => {
    expect(dueState('2026-03-04T09:59', NOW)).toBe('overdue')
    expect(dueState('2026-03-04T10:30', NOW)).toBe('today')
  })

  test('within six days is soon, after that later', () => {
    expect(dueState('2026-03-10', NOW)).toBe('soon')
    expect(dueState('2026-03-11', NOW)).toBe('later')
  })
})

describe('dueLabel', () => {
  test('names near days in words and others by date', () => {
    expect(dueLabel('2026-03-04', NOW, 'en', en)).toBe('Today')
    expect(dueLabel('2026-03-05', NOW, 'en', en)).toBe('Tomorrow')
    expect(dueLabel('2026-03-03', NOW, 'en', en)).toBe('Yesterday')
    expect(dueLabel('2026-03-06', NOW, 'en', en)).toBe('Fri')
    expect(dueLabel('2026-03-20', NOW, 'en', en)).toBe('Mar 20')
    expect(dueLabel('2027-01-02', NOW, 'en', en)).toBe('Jan 2, 2027')
  })

  test('adds the time when there is one', () => {
    expect(dueLabel('2026-03-05T15:30', NOW, 'en', en)).toMatch(/^Tomorrow 3:30\sPM$/)
  })
})

describe('quickDue', () => {
  test('reads day words relative to now', () => {
    expect(quickDue('today', NOW)).toBe('2026-03-04')
    expect(quickDue('Tomorrow', NOW)).toBe('2026-03-05')
    expect(quickDue('tmr', NOW)).toBe('2026-03-05')
  })

  test('a weekday is the next one, never today', () => {
    expect(quickDue('fri', NOW)).toBe('2026-03-06')
    expect(quickDue('friday', NOW)).toBe('2026-03-06')
    expect(quickDue('wed', NOW)).toBe('2026-03-11')
  })

  test('takes a full date and nothing else', () => {
    expect(quickDue('2026-04-01', NOW)).toBe('2026-04-01')
    expect(quickDue('alex', NOW)).toBeNull()
    expect(quickDue('fr', NOW)).toBeNull()
    expect(quickDue('2026-04-01T10:00', NOW)).toBeNull()
  })
})

describe('compareDue', () => {
  test('orders soonest first and puts no due last', () => {
    const dues = [undefined, '2026-03-05', '2026-03-04T12:00', '2026-03-04']
    expect(dues.sort(compareDue)).toEqual(['2026-03-04T12:00', '2026-03-04', '2026-03-05', undefined])
  })

  test('a whole-day due sorts after the times on that day', () => {
    expect(dueAt('2026-03-04')).toBeGreaterThan(dueAt('2026-03-04T23:59'))
  })
})
