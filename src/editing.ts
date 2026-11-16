// Small editing helpers for the markdown notes field. Pure: they take the text and caret and
// return the new ones, so they are tested without a DOM.

// `- `, `* `, `+ `, `1. ` or `1) `, each optionally followed by a task box, after any indent.
const LIST_ITEM = /^(\s*)([-*+]|(\d{1,9})([.)]))(\s+)(\[[ xX]\]\s+)?/

/**
 * Enter at the end of a list item starts the next item with the same marker: the number goes up
 * and a task box starts unticked. Enter on an item with no text ends the list instead. Null when
 * the caret is not at the end of a list item (or text is selected), so Enter works as usual.
 */
export function continueList(
  value: string,
  start: number,
  end: number = start
): { value: string; caret: number } | null {
  if (start !== end) return null
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEnd = value.indexOf('\n', start)
  if (value.slice(start, lineEnd === -1 ? undefined : lineEnd).trim()) return null
  const line = value.slice(lineStart, start)
  const m = LIST_ITEM.exec(line)
  if (!m) return null
  const [prefix, indent, bullet, num, delim, gap, box] = m
  if (!line.slice(prefix.length).trim()) {
    // An empty item: drop its marker and leave the list.
    return { value: value.slice(0, lineStart) + value.slice(start), caret: lineStart }
  }
  const marker = num ? `${Number(num) + 1}${delim}` : bullet
  const next = `\n${indent}${marker}${gap}${box ? '[ ] ' : ''}`
  return { value: value.slice(0, start) + next + value.slice(end), caret: start + next.length }
}
