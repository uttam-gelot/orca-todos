import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { openExternal } from './orca'
import './markdown.css'

marked.setOptions({ gfm: true, breaks: true })

/** GitHub-flavoured markdown to sanitized HTML. Bare URLs become links (GFM autolinks). */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(marked.parse(source, { async: false }), { USE_PROFILES: { html: true } })
}

/** Click handler for rendered markdown: links go to the OS browser, never navigate the frame. */
export function onMarkdownClick(e: MouseEvent): void {
  const link = (e.target as HTMLElement).closest('a')
  if (!link) return
  e.preventDefault()
  e.stopPropagation()
  if (/^(https?:|mailto:)/i.test(link.href)) openExternal(link.href)
}
