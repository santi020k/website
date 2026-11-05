import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { describe, expect, test } from 'vitest'

import { rehypePrintReferences } from '../rehype-print-references'

const path = '/repo/src/content/post/2026/example/index.mdx'
const element = (tagName: string, children: ElementContent[] = [], properties: Element['properties'] = {}): Element => ({
  type: 'element', tagName, properties, children
})
const text = (value: string): ElementContent => ({ type: 'text', value })
const link = (href: string, label = 'Read the guide') => element('a', [text(label)], { href })
const transform = (tree: Root, file = new VFile({ path })) => {
  unified().use(rehypePrintReferences, { site: 'https://santi020k.com' }).runSync(tree, file)

  return file
}

describe('article print Reference notes', () => {
  test('numbers links in reading order, deduplicates exact destinations, and preserves authored anchors', () => {
    const first = link('/blog/guide/?mode=full#start', 'A formatted guide')

    first.children = [element('em', [text('A formatted')]), text(' guide')]
    const original = structuredClone(first)
    const paragraph = element('p', [first, text(' and '), link('https://example.com/docs'), text(' then '), link('https://santi020k.com/blog/guide/?mode=full#start', 'The same guide')])
    const tree: Root = { type: 'root', children: [paragraph] }
    const file = new VFile({ path, data: { astro: { frontmatter: { articleFigureCaptions: ['A diagram'] } } } })

    transform(tree, file)
    expect(first).toEqual(original)
    expect(file.data.astro?.frontmatter).toEqual({
      articleFigureCaptions: ['A diagram'],
      articlePrintReferences: [
        { href: 'https://santi020k.com/blog/guide/?mode=full#start', label: 'A formatted guide' },
        { href: 'https://example.com/docs', label: 'Read the guide' }
      ]
    })
    expect(paragraph.children.filter(child => child.type === 'element' && child.tagName === 'sup')).toMatchObject([
      { children: [{ properties: { href: '#article-print-reference-1', ariaLabel: 'Reference 1' } }] },
      { children: [{ properties: { href: '#article-print-reference-2', ariaLabel: 'Reference 2' } }] },
      { children: [{ properties: { href: '#article-print-reference-1', ariaLabel: 'Reference 1' } }] }
    ])
    const once = structuredClone(tree)

    transform(tree, file)
    expect(tree).toEqual(once)
  })

  test('resolves relative and protocol-relative destinations against the published article', () => {
    const tree: Root = { type: 'root', children: [element('p', [link('../another/#chapter'), link('//example.com/docs'), link('https://example.com/docs#other')])] }
    const file = transform(tree)

    expect(file.data.astro?.frontmatter?.articlePrintReferences).toEqual([
      { href: 'https://santi020k.com/blog/another/#chapter', label: 'Read the guide' },
      { href: 'https://example.com/docs', label: 'Read the guide' },
      { href: 'https://example.com/docs#other', label: 'Read the guide' }
    ])
  })

  test('excludes same-page links, explicit URLs, non-web destinations, unsafe URLs and image-only links', () => {
    const tree: Root = { type: 'root',
      children: [element('p', [
        ...['#chapter', '/blog/example/#chapter', 'https://santi020k.com/blog/example/', '', 'mailto:hi@example.com', 'tel:123', 'javascript:alert(1)', 'data:text/plain,hello', 'https://[', 'https://user:password@example.com/'].map(href => link(href)),
        link('https://example.com/', 'example.com'),
        link('https://example.com/docs', 'https://example.com/docs'),
        element('a', [element('img', [], { src: '/image.webp', alt: 'Preview' })], { href: 'https://example.com/image' })
      ])] }
    const before = structuredClone(tree)

    expect(transform(tree).data.astro?.frontmatter?.articlePrintReferences).toEqual([])
    expect(tree).toEqual(before)
  })

  test('keeps editor text, navigation, headings, footnotes and hidden content untouched', () => {
    const children = ['pre', 'code', 'nav', 'button', 'h2'].map(tag => element(tag, [link('https://example.com/docs')]))

    children.push(element('figure', [link('https://example.com/code')], { 'data-ui-code': '' }))
    children.push(element('div', [link('https://example.com/hidden')], { hidden: true }))
    children.push(element('p', [element('a', [text('Back')], { href: 'https://example.com/back', dataFootnoteBackref: '' })]))
    const tree: Root = { type: 'root', children }
    const before = structuredClone(tree)

    transform(tree)
    expect(tree).toEqual(before)
  })

  test('includes prose in lists, tables, quotes and captions', () => {
    const tree: Root = { type: 'root', children: ['li', 'td', 'blockquote', 'figcaption'].map((tag, index) => element(tag, [link(`https://example.com/${index}`)])) }

    expect(transform(tree).data.astro?.frontmatter?.articlePrintReferences).toHaveLength(4)
  })

  test('supports current Markdown and MDX paths but leaves project and archive content alone', () => {
    for (const sourcePath of ['/repo/src/content/post/example.md', 'C:\\repo\\src\\content\\post\\example\\index.mdx']) {
      const tree: Root = { type: 'root', children: [element('p', [link('/blog/guide/')])] }

      const file = transform(tree, new VFile({ path: sourcePath }))

      expect(file.data.astro?.frontmatter?.articlePrintReferences).toHaveLength(1)
    }
    for (const sourcePath of ['/repo/src/content/project/example.md', '/repo/apps/v4/src/content/post/example.md', '']) {
      const tree: Root = { type: 'root', children: [element('p', [link('/blog/guide/')])] }
      const before = structuredClone(tree)

      transform(tree, new VFile(sourcePath ? { path: sourcePath } : {}))
      expect(tree).toEqual(before)
    }
  })
})
