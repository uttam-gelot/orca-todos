import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { openExternal } from './orca'
import './markdown.css'

marked.setOptions({ gfm: true, breaks: true })

/**
 * GitHub-flavoured markdown to sanitized HTML. Bare URLs become links (GFM autolinks). With
 * `tasks`, task-item checkboxes can be ticked (see `taskIndex`) and are named by their item's text.
 */
export function renderMarkdown(source: string, { tasks = false } = {}): string {
  const html = DOMPurify.sanitize(marked.parse(source, { async: false }), { USE_PROFILES: { html: true } })
  if (!tasks) return html
  const template = document.createElement('template')
  template.innerHTML = html
  for (const box of template.content.querySelectorAll<HTMLInputElement>('li > input[type="checkbox"]')) {
    box.removeAttribute('disabled')
    box.setAttribute('aria-label', box.parentElement?.textContent?.trim() || 'Checklist item')
  }
  return template.innerHTML
}

/** The position of a clicked task checkbox among the task checkboxes in `container`, or -1. */
export function taskIndex(target: EventTarget | null, container: HTMLElement): number {
  if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return -1
  return [...container.querySelectorAll('li > input[type="checkbox"]')].indexOf(target)
}

/** Click handler for rendered markdown: links go to the OS browser, never navigate the frame. */
export function onMarkdownClick(e: MouseEvent): void {
  const link = (e.target as HTMLElement).closest('a')
  if (!link) return
  e.preventDefault()
  e.stopPropagation()
  if (/^(https?:|mailto:)/i.test(link.href)) openExternal(link.href)
}
