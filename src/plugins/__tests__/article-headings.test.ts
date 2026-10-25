import type { Root } from 'hast'
import { h } from 'hastscript'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeArticleHeadings } from '../rehype-article-headings'

const transform = (tree: Root, path = '/repo/src/content/post/example/index.md'): Root => unified()
  .use(rehypeArticleHeadings).runSync(tree, path ? { path } : {})

describe('article Section cadence', () => {
  test('preserves heading identity, inline content, links, and sibling order', () => {
    const link = h('a', { href: '/blog/' }, 'related writing')
    const title = h('h2', { id: 'existing-fragment', lang: 'en' }, [
      'Using ', h('code', 'FlatCompat'), ' with ', h('em', 'care'), ' and ', link
    ])
    const children = title.children
    const paragraph = h('p', 'The original body.')
    const tree: Root = { type: 'root', children: [title, paragraph] }

    transform(tree)
    expect(tree.children).toEqual([title, paragraph])
    expect(title.properties).toEqual({ id: 'existing-fragment', lang: 'en', dataArticleSectionHeading: '' })
    expect(title.children).toMatchObject([{ tagName: 'span', children }])
    const text = title.children[0]

    if (text?.type !== 'element') throw new Error('Expected the inline heading text')
    expect(text.children).toBe(children)
    expect(text.children.at(-1)).toBe(link)
  })

  test('keeps nested component headings and other levels unchanged', () => {
    const tree: Root = { type: 'root',
      children: [
        h('h1', 'Title'),
        h('h3', 'Subsection'),
        h('h4', 'Detail'),
        h('aside', [h('h2', 'Update')]),
        h('blockquote', [h('h2', 'Quoted heading')])
      ] }
    const before = structuredClone(tree)

    expect(transform(tree)).toEqual(before)
  })

  test('supports MDX and Windows paths without wrapping twice', () => {
    const tree: Root = { type: 'root', children: [h('h2', 'A chapter')] }

    transform(tree, 'C:\\repo\\src\\content\\post\\example\\index.mdx')
    expect(tree.children[0]).toMatchObject({ properties: { dataArticleSectionHeading: '' } })
    const firstPass = structuredClone(tree)

    expect(transform(tree)).toEqual(firstPass)
  })

  test('does not change project, archived, or anonymous content', () => {
    for (const path of ['/repo/src/content/project/example/index.md', '/repo/apps/v3/src/content/post/example.md', '']) {
      const tree: Root = { type: 'root', children: [h('h2', 'Existing chapter')] }
      const before = structuredClone(tree)

      expect(transform(tree, path)).toEqual(before)
    }
  })
})
