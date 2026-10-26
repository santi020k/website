import { getReadingTime } from './reading-time'

const blockTags = new Set(['blockquote', 'br', 'dd', 'div', 'dl', 'dt', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'p', 'section', 'td', 'th', 'tr', 'ul'])
const tags = /<\/?([\w-]+)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gu

/** Accepts the site's trusted rendered narrative, not raw user HTML or MDX source. */
export const addProjectReadingBrief = (html: string): string => {
  const opening = html.indexOf('data-project-context-lead')

  if (opening < 0 || html.includes('data-project-reading-brief')) return html

  const headingEnd = html.indexOf('</h2>', opening)
  const sectionEnd = html.indexOf('</section>', opening)

  if (headingEnd < 0 || sectionEnd < 0 || headingEnd > sectionEnd) return html

  const narrative = html
    .replace(/<!--[\s\S]*?-->/gu, '')
    .replace(/<(script|style|pre|button|dialog|template)\b[^>]*>[\s\S]*?<\/\1>/giu, '')

  const text = narrative
    .replace(tags, (_match: string, tag: string) => blockTags.has(tag.toLowerCase()) ? ' ' : '')
    .replace(/&(?:nbsp|#160|#32|#x20|#xa0);/giu, ' ')

  const minutes = getReadingTime(text)
  const sections = Math.max(0, [...narrative.matchAll(/<h[23]\b/gu)].length - 1)
  const time = `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  const outline = sections ? `<div><dt>In this project story</dt><dd>${sections} ${sections === 1 ? 'section' : 'sections'}</dd></div>` : ''
  const brief = `<dl data-project-reading-brief><div><dt>Estimated reading time</dt><dd>${time}</dd></div>${outline}</dl>`
  const insertion = headingEnd + '</h2>'.length

  return html.slice(0, insertion) + brief + html.slice(insertion)
}
