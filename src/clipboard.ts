// Copying text from a plugin frame. Orca's isolated frames refuse `navigator.clipboard`, but the
// older `execCommand('copy')` works while a click or key press is being handled.

/** Copies `text` to the clipboard. Call it from a click or key handler. False when it did not copy. */
export function copyText(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  const before = document.activeElement as HTMLElement | null
  document.body.append(area)
  area.select()
  try {
    return document.execCommand('copy')
  } finally {
    area.remove()
    before?.focus?.()
  }
}
