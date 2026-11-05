import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeArticleOpening } from '../rehype-article-opening'

const path = '/repo/src/content/post/example/index.md'
const element = (tagName: string, children: ElementContent[] = []): Element => ({
  type: 'element', tagName, properties: {}, children
})
const paragraph = (value: string) => element('p', [{ type: 'text', value }])
const transform = (tree: Root, sourcePath: string = path, postType: unknown = 'Deep Dive'): Root => unified()
  .use(rehypeArticleOpening).runSync(tree, {
    ...(sourcePath ? { path: sourcePath } : {}),
    data: { astro: { frontmatter: { postType } } }
  })

describe('article Margin lead', () => {
  test('preserves the authored paragraph, inline markup, attributes, and following content', () => {
    const link = element('a', [{ type: 'text', value: 'the evidence' }])

    link.properties = { href: '/blog/', rel: ['noopener', 'noreferrer'] }
    const lead = element('p', [element('strong', [{ type: 'text', value: 'Read ' }]), link, element('code', [{ type: 'text', value: 'first' }])])

    lead.properties.id = 'original-introduction'
    const followup = paragraph('The next paragraph.')
    const heading = element('h2', [{ type: 'text', value: 'The next section' }])
    const tree: Root = { type: 'root', children: [lead, followup, heading] }

    transform(tree)
    expect(tree.children).toMatchObject([
      { tagName: 'div',
        properties: { dataArticleMarginLead: '', id: 'article-opening' },
        children: [
          { tagName: 'div',
            children: [
              { tagName: 'p', properties: { dataArticleFormat: '' }, children: [{ value: 'Deep Dive' }] },
              lead
            ] }
        ] }, followup, heading
    ])
    expect(lead.properties).toEqual({ id: 'original-introduction', dataArticleLead: '' })
    expect(lead.children[1]).toBe(link)
    expect(link.properties.href).toBe('/blog/')
    const firstPass = structuredClone(tree)

    transform(tree)
    expect(tree).toEqual(firstPass)
  })

  test('keeps a preceding update note intact and supports MDX and Windows paths', () => {
    const update = element('aside', [paragraph('The latest update.')])
    const lead = paragraph('The original introduction.')
    const tree: Root = { type: 'root', children: [update, lead] }

    transform(tree, 'C:\\repo\\src\\content\\post\\example\\index.mdx', 'Case Study')
    expect(tree.children[0]).toBe(update)
    expect(update.children[0]).toEqual(paragraph('The latest update.'))
    expect(JSON.stringify(tree.children[1])).toContain('Case Study')
    expect(lead.properties.dataArticleLead).toBe('')
  })

  test('uses Article when the format is absent or invalid', () => {
    for (const postType of [null, 42, '', '   ']) {
      const tree: Root = { type: 'root', children: [paragraph('The opening.')] }

      transform(tree, path, postType)
      expect(JSON.stringify(tree)).toContain('"value":"Article"')
    }
  })

  test('does not promote section paragraphs, media, nested prose, or an empty document', () => {
    for (const children of [
      [],
      [element('h2'), paragraph('Section text.')],
      [element('p', [element('img')]), paragraph('After an image.')],
      [element('blockquote', [paragraph('Quoted introduction.')])],
      [element('ul', [element('li', [paragraph('A list item.')])])]
    ]) {
      const tree: Root = { type: 'root', children }
      const before = structuredClone(tree)

      expect(transform(tree)).toEqual(before)
    }
  })

  test('leaves project, archived, and anonymous content unchanged', () => {
    for (const sourcePath of ['/repo/src/content/project/example/index.md', '/repo/apps/v3/src/content/post/example.md', '']) {
      const tree: Root = { type: 'root', children: [paragraph('The existing opening.')] }
      const before = structuredClone(tree)

      expect(transform(tree, sourcePath)).toEqual(before)
    }
  })
})
