import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeArticleChecklists } from '../rehype-article-checklists'

const element = (tagName: string, children: ElementContent[] = []): Element => ({ children, properties: {}, tagName, type: 'element' })
const text = (value: string): ElementContent => ({ type: 'text', value })
const heading = (tag = 'h2', title = 'Keyboard-testing checklist') => element(tag, [text(title)])
const item = () => element('li', [element('strong', [text('Entry:')]), text(' Use the skip link.')])
const transform = (children: ElementContent[], path = '/repo/src/content/post/2026/guide/index.mdx'): Root => unified()
  .use(rehypeArticleChecklists).runSync({ children, type: 'root' }, { path })

describe('article Checklist ledger', () => {
  test.each([
    'Lista de verificación de pruebas de teclado',
    '7. Lista final de comprobación de la migración',
    'Crea una lista de revisión para el trabajo adaptable',
    'Una lista práctica para revisar'
  ])('recognizes authored Spanish checklist headings: %s', title => {
    const lead = element('strong', [text('Entrada:')])
    const detail = text(' Usa el enlace de salto.')
    const list = element('ol', [element('li', [lead, detail])])
    const after = element('ol', [item()])

    transform([heading('h2', title), heading('h3', 'Teclado'), list, heading('h2', 'Conclusión'), after],
      '/repo/src/content/post/2026/guide/index.es.mdx')
    expect(list.properties).toEqual({ dataChecklistLedger: '', role: 'list' })
    expect(list.children[0]).toMatchObject({ children: [{ children: [
      { properties: { dataChecklistLedgerLead: '' }, children: [lead] },
      { properties: { dataChecklistLedgerDetail: '' }, children: [detail] }
    ] }] })
    expect(after.properties).toEqual({})
  })

  test.each(['Lista de dependencias', 'Revisión de arquitectura', 'Especialistas de accesibilidad'])(
    'preserves ordinary Spanish list sections: %s', title => {
      const list = element('ol', [item()])
      const before = structuredClone(list)

      transform([heading('h2', title), list], '/repo/src/content/post/2026/guide/index.es.md')
      expect(list).toEqual(before)
    }
  )

  test('preserves ordered numbering, lead punctuation, inline markup, and safe links', () => {
    const link = element('a', [text('documentation')])
    link.properties = { href: 'https://example.com/', rel: ['noopener', 'noreferrer'], target: '_blank' }
    const code = element('code', [text('Tab')])
    const lead = element('strong', [text('Entry:')])
    const tail = [text(' Use '), code, text(' and the '), link, text('.')]
    const row = element('li', [lead, ...tail])
    row.properties.value = '7'
    const list = element('ol', [row])
    list.properties = { start: 4, reversed: true }
    transform([heading(), list])
    expect(list.properties).toEqual({ start: 4, reversed: true, dataChecklistLedger: '', role: 'list' })
    expect(row).toMatchObject({ properties: { value: '7' },
      children: [{
        properties: { dataChecklistLedgerRow: '', dataChecklistLedgerSplit: '' },
        children: [
          { properties: { dataChecklistLedgerLead: '' }, children: [lead] },
          { properties: { dataChecklistLedgerDetail: '' }, children: tail }
        ]
      }] })
  })

  test('preserves loose paragraphs and nested lists without transforming nested items', () => {
    const nested = element('ul', [item()])
    const second = element('p', [text('Continue here.')])
    const list = element('ul', [element('li', [text('\n'), element('p', item().children), second, nested])])
    transform([heading(), list])
    expect(list.children[0]).toMatchObject({ children: [text('\n'), {
      children: [{ properties: { dataChecklistLedgerLead: '' } }, {
        children: [element('p', [text(' Use the skip link.')]), second, nested]
      }]
    }] })
    expect(nested.properties).toEqual({})
  })

  test('retains ordinary, mixed, unlabeled, fully emphasized, and empty lists', () => {
    const lists = [
      element('ol', [element('li', [text('Plain checklist')])]),
      element('ul', [item(), element('li', [text('Plain item')])]),
      element('ul', [element('li', [text('Read '), element('strong', [text('this')])])]),
      element('ul', [element('li', [element('strong', [text('Whole claim')])])]),
      element('ul', [element('li', [element('strong'), text(' explanation')])]),
      element('ul')
    ]
    const before = structuredClone(lists)
    transform([heading(), ...lists])
    expect(lists).toEqual(before)
    const outside = element('ol', [item()])
    transform([heading('h2', 'Instructions'), outside])
    expect(outside.properties).toEqual({})
  })

  test('tracks checklist sections through subheadings and exits at the next peer section', () => {
    const lists = Array.from({ length: 5 }, () => element('ol', [item()]))
    const before = element('ol', [item()])
    const [first, nested, sibling, after, newSection] = lists
    if (!first || !nested || !sibling || !after || !newSection) throw new Error('Missing fixture')
    transform([before,
      heading(),
      first,
      heading('h3', 'Form checklist'),
      nested,
      heading('h3', 'Navigation'),
      sibling,
      heading('h2', 'Conclusion'),
      after,
      heading('h2', 'Review checklists'),
      newSection])
    expect(lists.map(list => list.properties.dataChecklistLedger)).toEqual(['', '', '', undefined, ''])
    expect(before.properties).toEqual({})
  })

  test('ignores component and blockquote lists, and remains idempotent', () => {
    const quote = element('blockquote', [heading(), element('ol', [item()])])
    const component = element('aside', [element('ol', [item()])])
    const nestedBefore = structuredClone([quote, component])
    const list = element('ol', [item()])
    const tree = transform([heading(), quote, component, list])
    expect([quote, component]).toEqual(nestedBefore)
    const before = structuredClone(tree)
    unified().use(rehypeArticleChecklists).runSync(tree, { path: '/repo/src/content/post/guide.md' })
    expect(tree).toEqual(before)
  })

  test.each(['/repo/src/content/project/smith/index.md', '/repo/src/pages/about.md', '/repo/apps/v4/src/content/post/guide.md'])(
    'ignores content outside current articles: %s', path => {
      const list = element('ol', [item()])
      const before = structuredClone(list)
      transform([heading(), list], path)
      expect(list).toEqual(before)
    }
  )

  test('supports Windows paths and leaves anonymous input alone', () => {
    const list = element('ol', [item()])
    const anonymous = structuredClone(list)
    transform([heading(), list], 'C:\\repo\\src\\content\\post\\guide.md')
    expect(list.properties.dataChecklistLedger).toBe('')
    unified().use(rehypeArticleChecklists).runSync({ children: [heading(), anonymous], type: 'root' })
    expect(anonymous.properties).toEqual({})
  })
})
