import { beforeEach, describe, expect, test } from 'bun:test'
import { browserStorage, openExternal } from '../../src/orca'
import { fakeOrca } from '../setup'

beforeEach(() => {
  localStorage.clear()
  fakeOrca.reset()
})

describe('browserStorage (preview fallback)', () => {
  test('round-trips JSON values under a plugin prefix', async () => {
    await browserStorage.set('todo:a', { title: 'x' })
    expect(localStorage.getItem('orca-todos:todo:a')).toBe('{"title":"x"}')
    expect(await browserStorage.get('todo:a')).toEqual({ title: 'x' })
    expect(await browserStorage.get('missing')).toBeNull()
  })
  test('lists only its own keys, without the prefix', async () => {
    localStorage.setItem('other-app', '1')
    await browserStorage.set('states', [])
    expect(await browserStorage.keys()).toEqual(['states'])
  })
})

describe('openExternal', () => {
  test('hands links to Orca so they open in the OS browser', () => {
    openExternal('https://example.com/')
    expect(fakeOrca.opened).toEqual(['https://example.com/'])
  })
})
