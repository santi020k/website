import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

import { createLumenScrollCue } from './lumen-scroll-cue'

const textContent = (node: ElementContent): string => {
  if (node.type === 'text') return node.value

  if (node.type === 'element') return node.children.map(textContent).join('')

  return ''
}

/** Give Markdown tables Lumen's scroll surface without replacing native table semantics. */
export const rehypeReadableTables: Plugin<[], Root> = () => (tree, file) => {
  const article = file.history.some(path => path.replaceAll('\\', '/').includes('/src/content/post/'))
  let heading = ''
  let tableNumber = 0

  visit(tree, 'element', (node, index, parent) => {
    if (/^h[1-6]$/u.test(node.tagName)) heading = textContent(node).trim()

    if (node.tagName !== 'table' || index === undefined || !parent) return

    tableNumber += 1

    if (parent.type === 'element' && parent.properties.dataProseTable !== undefined) return SKIP

    const caption = node.children.find(child => child.type === 'element' && child.tagName === 'caption')
    const label = caption ? textContent(caption).trim() : heading

    const viewport: Element = {
      children: [node],
      properties: {
        ariaLabel: label ? `Table ${tableNumber}: ${label}` : `Table ${tableNumber}`,
        className: ['ui-table-wrap'],
        dataProseTable: '',
        dataSlot: 'table',
        role: 'region',
        tabIndex: 0
      },
      tagName: 'div',
      type: 'element'
    }

    if (article) viewport.properties.dataScrollCueViewport = ''

    parent.children.splice(index, 1, article ?
      {
        children: [
          createLumenScrollCue(`article-table-scroll-cue-${tableNumber}`, 'Scroll horizontally to compare'),
          viewport
        ],
        properties: { className: ['ui-table-scroll'], dataArticleTableFolio: '', dataUiScrollCue: '' },
        tagName: 'div',
        type: 'element'
      } :
      viewport)

    return SKIP
  })
}
