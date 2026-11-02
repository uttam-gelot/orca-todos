import { describe, expect, test } from 'bun:test'
import { render } from 'preact'
import { ago, Kbd, PriorityIcon } from '../../src/components/ui'

const MIN = 60 * 1000

describe('ago', () => {
  test('formats elapsed time compactly', () => {
    expect(ago(0, 30 * 1000)).toBe('now')
    expect(ago(0, 5 * MIN)).toBe('5m')
    expect(ago(0, 3 * 24 * 60 * MIN)).toBe('3d')
  })
})

describe('Kbd', () => {
  test('mixes the small modifier and a parent element class', () => {
    const root = document.createElement('div')
    render(
      <Kbd small class="menu__kbd">
        ?
      </Kbd>,
      root
    )
    expect(root.querySelector('kbd')?.className).toBe('kbd kbd--sm menu__kbd')
  })
})

describe('PriorityIcon', () => {
  test('names the priority for hover and screen readers', () => {
    const root = document.createElement('div')
    render(<PriorityIcon priority="high" />, root)
    expect(root.querySelector('.prio--high')?.getAttribute('title')).toBe('High priority')
  })
})
