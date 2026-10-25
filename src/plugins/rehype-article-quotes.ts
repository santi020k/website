import { getLumenIcon, type LumenIconNode } from '@santi020k/lumen-core'
import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const element = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element', tagName, properties, children
})

const iconNode = ([tagName, attributes, children = []]: LumenIconNode): Element => element(
  tagName, { ...attributes }, children.map(iconNode)
)

/** Give article quotations a decorative margin without changing their authored content. */
export const rehypeArticleQuotes: Plugin<[], Root> = () => (tree, file) => {
  const sourcePath = file.history.at(-1)?.replace(/\\/gu, '/')

  if (!sourcePath || !/(?:^|\/)src\/content\/post\//u.test(sourcePath) || /(?:^|\/)apps\//u.test(sourcePath)) return

  visit(tree, 'element', node => {
    if (node.tagName !== 'blockquote' || node.properties.dataArticleQuote !== undefined) return

    node.properties.dataArticleQuote = ''

    node.children = [element('div', { dataQuoteLayout: '' }, [
      element('svg', {
        ariaHidden: 'true',
        dataQuoteMark: '',
        fill: 'none',
        focusable: 'false',
        stroke: 'currentColor',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: '2',
        viewBox: '0 0 24 24'
      }, getLumenIcon('quote')?.node.map(iconNode) ?? []),
      element('div', { dataQuoteBody: '' }, node.children)
    ])]
  })
}
