import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeProjectLedger } from '../rehype-project-ledger'

const element = (tagName: string, children: ElementContent[] = []): Element => ({
  children, properties: {}, tagName, type: 'element'
})
const text = (value: string): ElementContent => ({ type: 'text', value })
const transform = (list: Element, path = '/repo/src/content/project/smith/index.md'): Root => unified()
  .use(rehypeProjectLedger)
  .runSync({ children: [list], type: 'root' }, { path })

describe('project Ownership ledger', () => {
  test('keeps the authored lead, explanation, inline code, and safe links in reading order', () => {
    const lead = element('strong', [text('UI systems')])
    const code = element('code', [text('TypeScript')])
    const link = element('a', [text('the docs')])
    link.properties = { href: 'https://example.com/', rel: ['noopener', 'noreferrer'], target: '_blank' }
    const rest = [text(' using '), code, text(' and '), link, text('.')]
    const list = element('ul', [element('li', [lead, ...rest])])

    transform(list)

    expect(list.properties).toEqual({ dataProjectLedger: '', role: 'list' })
    expect(list.children[0]).toMatchObject({ children: [{
      properties: { dataProjectLedgerRow: '', dataProjectLedgerSplit: '' },
      children: [
        { properties: { dataProjectLedgerLead: '' }, children: [lead] },
        { properties: { dataProjectLedgerDetail: '' }, children: rest }
      ]
    }] })
  })

  test('preserves loose paragraphs, nested lists, and ordered-list metadata', () => {
    const nested = element('ul', [element('li', [text('Nested detail')])])
    const paragraph = element('p', [text('Second paragraph.')])
    const list = element('ol', [element('li', [
      text('\n'),
      element('p', [element('strong', [text('Lead')]), text(' explanation.')]),
      paragraph,
      nested
    ])])
    list.properties = { start: 3, reversed: true }

    transform(list)

    expect(list.properties).toMatchObject({ start: 3, reversed: true, role: 'list' })
    expect(list.children[0]).toMatchObject({ children: [text('\n'), {
      children: [
        { properties: { dataProjectLedgerLead: '' } },
        { children: [element('p', [text(' explanation.')]), paragraph, nested] }
      ]
    }] })
    expect(nested.properties).toEqual({})
  })

  test('does not invent an empty explanation for a fully emphasized claim', () => {
    const lead = element('strong', [text('A 100% accessibility score.')])
    const list = element('ul', [element('li', [lead])])

    transform(list)

    expect(list.children[0]).toMatchObject({ children: [{
      properties: { dataProjectLedgerRow: '' },
      children: [{ properties: { dataProjectLedgerLead: '' }, children: [lead] }]
    }] })
  })

  test('preserves plain entries, non-leading emphasis, and empty items without splitting them', () => {
    const content = [text('Read '), element('strong', [text('this')]), text(' carefully.')]
    const list = element('ul', [element('li', content), element('li')])

    transform(list)

    expect(list.children[0]).toMatchObject({ children: [{
      properties: { dataProjectLedgerRow: '' },
      children: [{ properties: { dataProjectLedgerDetail: '' }, children: content }]
    }] })
    expect(list.children[1]).toMatchObject({ children: [{ properties: { dataProjectLedgerRow: '' } }] })
  })

  test.each(['/repo/src/content/project/void/index.mdx', 'src/content/project/auth/index.md', 'C:\\repo\\src\\content\\project\\auth\\index.md'])(
    'supports project source paths: %s', path => {
      const list = element('ul', [element('li', [element('strong', [text('Lead')]), text(' body')])])
      transform(list, path)
      expect(list.properties.dataProjectLedger).toBe('')
    }
  )

  test.each(['/repo/src/content/post/article.md', '/repo/src/pages/about.md'])(
    'does not affect other content: %s', path => {
      const list = element('ul', [element('li', [element('strong', [text('Lead')]), text(' body')])])
      const before = structuredClone(list)
      transform(list, path)
      expect(list).toEqual(before)
    }
  )

  test('leaves anonymous input and blockquote lists unchanged, and is idempotent', () => {
    const list = element('ul', [element('li', [text('Plain copy')])])
    const quote = element('blockquote', [structuredClone(list)])
    const anonymous = structuredClone(list)
    unified().use(rehypeProjectLedger).runSync({ type: 'root', children: [anonymous] })
    expect(anonymous).toEqual(list)
    expect(transform(quote).children).toEqual([quote])

    const tree = transform(list)
    const before = structuredClone(tree)
    unified().use(rehypeProjectLedger).runSync(tree, { path: '/repo/src/content/project/auth/index.md' })
    expect(tree).toEqual(before)
  })
})
