import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeReadableTables } from '../rehype-readable-tables'

const element = (tagName: string, children: ElementContent[] = []): Element => ({
  children, properties: {}, tagName, type: 'element'
})
const text = (value: string): ElementContent => ({ type: 'text', value })
const transform = (children: ElementContent[]): Root => unified()
  .use(rehypeReadableTables)
  .runSync({ children, type: 'root' })

describe('readable Markdown tables', () => {
  test('preserves native table structure inside a named keyboard scroll region', () => {
    const table = element('table', [element('thead', [element('tr', [element('th', [text('Name')])])])])
    const heading = element('h2', [text('Compare '), element('em', [text('options')])])
    const tree = transform([heading, table])

    expect(tree.children).toEqual([heading, {
      children: [table],
      properties: {
        ariaLabel: 'Table 1: Compare options',
        className: ['ui-table-wrap'],
        dataProseTable: '',
        dataSlot: 'table',
        role: 'region',
        tabIndex: 0
      },
      tagName: 'div',
      type: 'element'
    }])
  })

  test('uses a caption before a nearby heading and numbers repeated tables', () => {
    const tree = transform([
      element('h2', [text('Results')]),
      element('table', [element('caption', [text('  Speed '), element('strong', [text('comparison')])])]),
      element('table')
    ])

    expect(tree.children[1]).toMatchObject({ properties: { ariaLabel: 'Table 1: Speed comparison' } })
    expect(tree.children[2]).toMatchObject({ properties: { ariaLabel: 'Table 2: Results' } })
  })

  test('provides a fallback name and does not double-wrap tables on a second pass', () => {
    const tree = transform([element('table')])
    const before = structuredClone(tree)

    unified().use(rehypeReadableTables).runSync(tree)

    expect(tree).toEqual(before)
    expect(tree.children[0]).toMatchObject({ properties: { ariaLabel: 'Table 1' } })
  })

  test('leaves other content unchanged', () => {
    const children = [element('p', [text('A paragraph')]), element('pre', [text('Code')])]

    expect(transform(children).children).toEqual(children)
  })
})
