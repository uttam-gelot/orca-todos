import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import { log, logConfig } from '../../src/log'

const original = logConfig.level
afterEach(() => (logConfig.level = original))

describe('log', () => {
  test('writes structured entries through the matching console method', () => {
    logConfig.level = 'debug'
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    const cause = new Error('boom')
    log.warn('Could not save', { op: 'write', key: 'todo:a' }, cause)
    expect(warn).toHaveBeenCalledWith('[orca-todos] Could not save', { op: 'write', key: 'todo:a' }, cause)
    warn.mockRestore()
  })
  test('drops entries below the configured level', () => {
    logConfig.level = 'warn'
    const info = spyOn(console, 'info').mockImplementation(() => {})
    log.info('Loaded')
    expect(info).not.toHaveBeenCalled()
    info.mockRestore()
  })
})
