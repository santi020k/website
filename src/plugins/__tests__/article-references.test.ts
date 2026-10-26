import type { Element, ElementContent, Root, RootContent } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeArticleOpening } from '../rehype-article-opening'
import { rehypeArticleReferences } from '../rehype-article-references'

const path = '/repo/src/content/post/example/index.md'
const element = (tagName: string, children: ElementContent[] = [], properties: Element['properties'] = {}): Element => ({
  type: 'element', tagName, properties, children
})
const text = (value: string): ElementContent => ({ type: 'text', value })
const reference = (label: string, href = '/blog/earlier/') => element('p', [element('a', [text(label)], { href })])
const paragraph = (value: string) => element('p', [text(value)])
const transform = (tree: Root, sourcePath = path) => unified().use(rehypeArticleReferences).use(rehypeArticleOpening)
  .runSync(tree, { ...(sourcePath ? { path: sourcePath } : {}), data: { astro: { frontmatter: { postType: 'Guide' } } } })
const contents = (node: Root | RootContent): string => {
  if (node.type === 'text') return node.value
  if (node.type === 'element' || node.type === 'root') return node.children.map(contents).join('')
  return ''
}

describe('article Reference ledger', () => {
  test('shares the opening ledger renderer with a distinct closing series connection', () => {
    const connection = element('p', [element('a', [text('Related series: Migration guide')], {
      href: '/blog/migration-guide/', title: 'ESLint in Practice'
    })])
    const closing = paragraph('The final takeaway.')
    const tree: Root = { type: 'root',
      children: [
        paragraph('Introduction.'), reference('Related post: Context'), element('h2', [text('Conclusions')]), closing, connection, text('\n')
      ] }

    transform(tree)
    const ledgers = tree.children.filter(node => node.type === 'element' && node.properties.dataArticleReferences !== undefined)

    expect(ledgers).toHaveLength(2)
    expect(ledgers[0]).toMatchObject({ tagName: 'nav', properties: { ariaLabel: 'References for this article' } })
    expect(ledgers[1]).toMatchObject({ tagName: 'nav', properties: { ariaLabel: 'Related reading' } })
    expect(ledgers.map(contents)).toEqual([
      ['With this guide', 'Related guide', 'Context'].join(''),
      ['Related reading', 'Another series', 'Migration guide', 'ESLint in Practice'].join('')
    ])
    expect(tree.children.at(-3)).toBe(closing)
    expect(connection.children[0]).toMatchObject({ properties: {
      href: '/blog/migration-guide/', title: 'ESLint in Practice', dataReferenceLink: ''
    } })
    const firstPass = structuredClone(tree)

    transform(tree)
    expect(tree).toEqual(firstPass)
  })

  test('requires explicit series context in the final standalone paragraph', () => {
    const connection = () => element('p', [element('a', [text('Related series: Migration guide')], {
      href: '/blog/migration-guide/', title: 'ESLint in Practice'
    })])

    for (const children of [
      [connection(), element('h2'), paragraph('Chapter text.')],
      [element('h2'), connection(), paragraph('The article continues.')],
      [element('blockquote', [connection()])],
      [reference('Related series: No series name')],
      [element('p', [element('a', [text('Related series: Empty name')], { href: '/blog/guide/', title: ' ' })])]
    ]) {
      const tree: Root = { type: 'root', children }
      const before = structuredClone(tree)

      unified().use(rehypeArticleReferences).runSync(tree, { path })
      expect(tree).toEqual(before)
    }
  })

  test('the actual introduction leads; references retain destinations and move before the first chapter', () => {
    const earlier = reference('Read the Previous Post: Earlier article')
    const repository = reference('GitHub Repository', 'https://github.com/santi020k/eslint-config-basic')
    const related = reference('Related post: Related guide', 'https://example.com/guide')
    const intro = paragraph('The authored introduction.')
    const followup = paragraph('More context.')
    const heading = element('h2', [text('First chapter')])
    const close = reference('Next Post: Next article')
    const relatedLink = related.children[0]

    if (relatedLink?.type !== 'element') throw new Error('Expected an anchor')
    relatedLink.properties = { href: 'https://example.com/guide', target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }
    const beforeProperties = structuredClone(relatedLink.properties)
    const tree: Root = { type: 'root', children: [earlier, intro, followup, related, repository, heading, close] }

    transform(tree)
    expect(tree.children[0]).toMatchObject({ properties: { dataArticleMarginLead: '' } })
    expect(contents(tree)).toContain('GuideThe authored introduction.More context.')
    expect(tree.children[1]).toBe(followup)
    const ledger = tree.children[2]

    if (ledger?.type !== 'element') throw new Error('Expected a ledger')
    expect(ledger).toMatchObject({ tagName: 'nav', properties: { ariaLabel: 'References for this article' } })
    expect(contents(ledger)).toBe([
      'With this guide',
      'Related guide',
      'Related guide',
      'Repository',
      'eslint-config-basic',
      'github.com / santi020k',
      'Earlier article',
      'Earlier article'
    ].join(''))
    expect(relatedLink.properties).toEqual({ ...beforeProperties, dataReferenceLink: '' })
    expect(tree.children.slice(3)).toEqual([heading, close])
    expect(tree.children).not.toContain(earlier)
    expect(tree.children).not.toContain(repository)
    const firstPass = structuredClone(tree)

    transform(tree)
    expect(tree).toEqual(firstPass)
  })

  test('names a repository subpath without changing its exact query or fragment', () => {
    const href = 'https://github.com/santi020k/posts/tree/post-3?tab=readme-ov-file#usage'
    const repository = reference('GitHub Repository', href)
    const link = repository.children[0]
    const tree: Root = { type: 'root', children: [repository, paragraph('Introduction.'), element('h2')] }

    transform(tree)
    expect(link).toMatchObject({ properties: { href, dataReferenceLink: '' } })
    expect(contents(tree)).toContain(['Repository', 'posts / tree / post-3', 'github.com / santi020k'].join(''))
  })

  test('preserves updates, inline links, unrecognized standalone links, and references inside chapters', () => {
    const update = element('aside', [paragraph('Update.')])
    const unknown = reference('Start here')
    const intro = element('p', [text('See '), element('a', [text('Related post: Context')], { href: '/blog/context/' }), text(' for context.')])
    const chapterReference = reference('GitHub Repository', 'https://github.com/santi020k/posts')
    const tree: Root = { type: 'root', children: [update, unknown, intro, element('h2'), chapterReference] }
    const original = structuredClone([update, unknown, intro.children, chapterReference])

    transform(tree)
    expect([update, unknown, intro.children, chapterReference]).toEqual(original)
    expect(intro.properties.dataArticleLead).toBe('')
    expect(tree.children.filter(node => node.type === 'element' && node.properties.dataArticleReferences !== undefined)).toHaveLength(0)
  })

  test('keeps formatted, annotated, nested, malformed, and non-repository links in their original context', () => {
    const marked = reference('Related post: Context')

    marked.properties.id = 'authored-link'
    const formatted = element('p', [element('a', [element('strong', [text('GitHub Repository')])], { href: 'https://github.com/santi020k/posts' })])
    const children = [
      marked,
      formatted,
      element('blockquote', [reference('Related post: Quoted reference')]),
      reference('GitHub Repository', 'https://github.com/santi020k'),
      reference('GitHub Repository', 'https://example.com/repository'),
      reference('GitHub Repository', 'https://['),
      reference('Related post: No URL', 'javascript:alert(1)')
    ]
    const tree: Root = { type: 'root', children }
    const before = structuredClone(tree)

    unified().use(rehypeArticleReferences).runSync(tree, { path })
    expect(tree).toEqual(before)
  })

  test('supports Markdown and MDX on Windows, but excludes projects, archives, and anonymous documents', () => {
    for (const sourcePath of [path, 'C:\\repo\\src\\content\\post\\example\\index.mdx']) {
      const tree: Root = { type: 'root', children: [reference('Previous post: Context'), paragraph('Introduction.')] }

      transform(tree, sourcePath)
      expect(contents(tree)).toContain('Earlier articleContext')
    }
    for (const sourcePath of ['/repo/src/content/project/example/index.md', '/repo/apps/v3/src/content/post/example.md', '']) {
      const tree: Root = { type: 'root', children: [reference('Related post: Context'), paragraph('Introduction.')] }
      const before = structuredClone(tree)

      expect(transform(tree, sourcePath)).toEqual(before)
    }
  })
})
