import type { ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

const textContent = (node: ElementContent): string => {
  if (node.type === 'text') return node.value

  if (node.type === 'element') return node.children.map(textContent).join('')

  return ''
}

/** Give Markdown tables Lumen's scroll surface without replacing native table semantics. */
export const rehypeReadableTables: Plugin<[], Root> = () => tree => {
  let heading = ''
  let tableNumber = 0

  visit(tree, 'element', (node, index, parent) => {
    if (/^h[1-6]$/u.test(node.tagName)) heading = textContent(node).trim()

    if (node.tagName !== 'table' || index === undefined || !parent) return

    tableNumber += 1

    if (parent.type === 'element' && parent.properties.dataProseTable !== undefined) return SKIP

    const caption = node.children.find(child => child.type === 'element' && child.tagName === 'caption')
    const label = caption ? textContent(caption).trim() : heading

    parent.children.splice(index, 1, {
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
    })

    return SKIP
  })
}
