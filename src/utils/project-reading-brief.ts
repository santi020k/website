import type { DefaultTreeAdapterTypes } from 'parse5'
import { parseFragment } from 'parse5'

import type { Locale } from '@/i18n'

import { getReadingTime } from './reading-time'

const blockTags = new Set(['blockquote', 'br', 'dd', 'div', 'dl', 'dt', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'p', 'section', 'td', 'th', 'tr', 'ul'])
const excludedTags = new Set(['script', 'style', 'pre', 'button', 'dialog', 'template'])

/** Read trusted rendered narrative without rewriting the authored markup. */
export const addProjectReadingBrief = (html: string, locale: Locale = 'en'): string => {
  if (!html.includes('data-project-context-lead')) return html

  const text: string[] = []

  const summary: { insertion: number | undefined, headings: number, hasBrief: boolean } = {
    insertion: undefined,
    headings: 0,
    hasBrief: false
  }

  const visit = (node: DefaultTreeAdapterTypes.Node, insideOpening = false): void => {
    if ('value' in node) {
      text.push(node.value)

      return
    }

    if ('tagName' in node) {
      const { tagName } = node

      if (excludedTags.has(tagName)) {
        text.push(' ')

        return
      }

      summary.hasBrief ||= node.attrs.some(attribute => attribute.name === 'data-project-reading-brief')

      const isOpening = tagName === 'section' && node.sourceCodeLocation?.endTag !== undefined &&
        node.attrs.some(attribute => attribute.name === 'data-project-context-lead')

      const inOpening = insideOpening || isOpening

      if (tagName === 'h2' || tagName === 'h3') {
        summary.headings += 1

        if (inOpening && tagName === 'h2') summary.insertion ??= node.sourceCodeLocation?.endTag?.endOffset
      }

      if (blockTags.has(tagName)) text.push(' ')

      for (const child of node.childNodes) visit(child, inOpening)

      if (blockTags.has(tagName)) text.push(' ')

      return
    }

    if ('childNodes' in node) {
      for (const child of node.childNodes) visit(child, insideOpening)
    }
  }

  visit(parseFragment(html, { sourceCodeLocationInfo: true }))

  const { insertion, hasBrief, headings } = summary

  if (insertion === undefined || hasBrief) return html

  const minutes = getReadingTime(text.join('').replace(/\u00a0/gu, ' '))
  const sections = Math.max(0, headings - 1)
  const time = locale === 'es' ? `Aproximadamente ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` : `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  const outlineLabel = locale === 'es' ? 'En este caso de estudio' : 'In this project story'
  const sectionLabels = locale === 'es' ? ['sección', 'secciones'] as const : ['section', 'sections'] as const
  const sectionLabel = sectionLabels[sections === 1 ? 0 : 1]
  const timeLabel = locale === 'es' ? 'Tiempo de lectura estimado' : 'Estimated reading time'
  const outline = sections ? `<div><dt>${outlineLabel}</dt><dd>${sections} ${sectionLabel}</dd></div>` : ''
  const brief = `<dl data-project-reading-brief><div><dt>${timeLabel}</dt><dd>${time}</dd></div>${outline}</dl>`

  return html.slice(0, insertion) + brief + html.slice(insertion)
}
