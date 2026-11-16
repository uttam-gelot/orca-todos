import { describe, expect, test } from 'bun:test'
import { continueList } from '../../src/editing'

const at = (text: string) => continueList(text.replace('|', ''), text.indexOf('|'))

describe('continueList', () => {
  test('continues bullets, numbers and task items', () => {
    expect(at('- one|')).toEqual({ value: '- one\n- ', caret: 8 })
    expect(at('  9) nine|')).toEqual({ value: '  9) nine\n  10) ', caret: 16 })
    expect(at('- [x] done|')).toEqual({ value: '- [x] done\n- [ ] ', caret: 17 })
  })

  test('ends the list on an empty item', () => {
    expect(at('- one\n- |')).toEqual({ value: '- one\n', caret: 6 })
    expect(at('- one\n- [ ] |\nafter')).toEqual({ value: '- one\n\nafter', caret: 6 })
  })

  test('leaves Enter alone outside lists, mid-line, and with a selection', () => {
    expect(at('plain text|')).toBeNull()
    expect(at('- one| two')).toBeNull()
    expect(continueList('- one', 2, 4)).toBeNull()
    expect(at('-not a list|')).toBeNull()
  })
})
