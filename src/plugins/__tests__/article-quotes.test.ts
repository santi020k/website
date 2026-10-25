import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeArticleQuotes } from '../rehype-article-quotes'

const path = '/repo/src/content/post/example/index.md'
const element = (tagName: string, children: ElementContent[] = []): Element => ({
  type: 'element', tagName, properties: {}, children
})
const paragraph = (value: string): Element => element('p', [{ type: 'text', value }])
const transform = (tree: Root, sourcePath?: string): Root => unified()
  .use(rehypeArticleQuotes).runSync(tree, sourcePath ? { path: sourcePath } : undefined)

describe('article Margin quotation', () => {
  test('preserves the native quote, citation, paragraphs, inline markup and lists', () => {
    const emphasis = element('em', [{ type: 'text', value: 'Still open.' }])
    const link = element('a', [{ type: 'text', value: 'Evidence' }])
    link.properties = { href: '/blog/', rel: ['noopener', 'noreferrer'] }
    const content = [paragraph('A handoff.'), element('p', [emphasis, link]), element('ul', [element('li', [paragraph('Follow up.')])])]
    const quote = element('blockquote', content)
    quote.properties = { cite: 'https://example.com/source', id: 'handoff' }
    const tree: Root = { type: 'root', children: [quote] }
    transform(tree, path)

    expect(tree.children[0]).toBe(quote)
    expect(quote.properties).toEqual({ cite: 'https://example.com/source', id: 'handoff', dataArticleQuote: '' })
    expect(quote.children).toMatchObject([{ tagName: 'div',
      children: [
        { tagName: 'svg', properties: { ariaHidden: 'true', focusable: 'false' } },
        { tagName: 'div', children: content }
      ] }])
    const layout = quote.children[0]
    if (layout?.type !== 'element') throw new TypeError('Expected quote layout')
    const icon = layout.children[0]
    if (icon?.type !== 'element') throw new TypeError('Expected decorative icon')
    expect(icon.children.length).toBeGreaterThan(0)
    expect(icon.children.every(child => child.type === 'element')).toBe(true)
  })

  test('keeps nested quotations and remains unchanged on a second pass', () => {
    const nested = element('blockquote', [paragraph('A quoted response.')])
    const quote = element('blockquote', [paragraph('The original.'), nested])
    const tree: Root = { type: 'root', children: [quote] }
    transform(tree, path)
    expect(nested.properties.dataArticleQuote).toBe('')
    const before = structuredClone(tree)
    transform(tree, path)
    expect(tree).toEqual(before)
  })

  test('does not change project, archived or anonymous documents, or article callouts', () => {
    for (const sourcePath of ['/repo/src/content/project/example/index.md', '/repo/apps/v3/src/content/post/example.md', undefined]) {
      const tree: Root = { type: 'root', children: [element('blockquote', [paragraph('Existing quote.')])] }
      const before = structuredClone(tree)
      expect(transform(tree, sourcePath)).toEqual(before)
    }
    const callout = element('aside', [paragraph('An update note.')])
    const before = structuredClone(callout)
    expect(transform({ type: 'root', children: [callout] }, path).children).toEqual([before])
  })

  test('supports Windows paths and MDX documents', () => {
    const quote = element('blockquote', [paragraph('A quotation.')])
    transform({ type: 'root', children: [quote] }, 'C:\\repo\\src\\content\\post\\example\\index.mdx')
    expect(quote.properties.dataArticleQuote).toBe('')
  })
})
