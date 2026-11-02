import { getLumenIcon, type LumenIconName, type LumenIconNode } from '@santi020k/lumen-core'
import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

import { arrowSymbolId } from '../utils/arrow-sprite'

interface Reference {
  paragraph: Element
  link: Element
  kind: 'Related guide' | 'Repository' | 'Earlier article' | 'Another series'
  title: string
  source?: string
}

const element = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element', tagName, properties, children
})

const text = (value: string): ElementContent => ({ type: 'text', value })

const iconNode = ([tagName, attributes, children = []]: LumenIconNode): Element => element(
  tagName, { ...attributes }, children.map(iconNode)
)

const iconAttributes = {
  ariaHidden: 'true',
  focusable: 'false',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24'
}

const icon = (name: LumenIconName): Element => element('svg', { ...iconAttributes }, getLumenIcon(name)?.node.map(iconNode) ?? [])

// Reference the base layout's shared arrow symbol (ArrowSprite) instead of repeating its paths.
const arrowGlyph = (direction: 'right' | 'up-right'): Element => element('svg', { ...iconAttributes }, [
  element('use', { href: `#${arrowSymbolId(direction)}` }, [])
])

// Match ArrowExchange's decorative track for Markdown-generated links.
const arrowExchange = (direction: 'right' | 'up-right'): Element => element('span', {
  ariaHidden: 'true', dataArrowExchange: direction
}, [element('span', { dataArrowTrack: '' }, [
  element('span', { dataArrowGlyph: '' }, [arrowGlyph(direction)]),
  element('span', { dataArrowGlyph: '', dataArrowIncoming: '' }, [arrowGlyph(direction)])
])])

const readReference = (paragraph: Element): Reference | undefined => {
  // Only explicitly labeled standalone references opt in.
  if (paragraph.tagName !== 'p' || Object.keys(paragraph.properties).length > 0) return

  const content = paragraph.children.filter(child => child.type !== 'text' || child.value.trim())
  const link = content[0]

  if (content.length !== 1 || link?.type !== 'element' || link.tagName !== 'a') return

  if (!link.children.every(child => child.type === 'text')) return

  const label = link.children.map(child => child.value).join('').trim()
  const href = link.properties.href

  if (typeof href !== 'string' || !/^(?:\/(?!\/)|https?:\/\/)/u.test(href)) return

  const related = /^Related post:\s*(\S.*)$/iu.exec(label)
  const earlier = /^(?:Read the )?Previous post:\s*(\S.*)$/iu.exec(label)
  const series = /^Related series:\s*(\S.*)$/iu.exec(label)
  const seriesTitle = link.properties.title

  if (series?.[1] && typeof seriesTitle === 'string' && seriesTitle.trim()) {
    return { paragraph, link, kind: 'Another series', title: series[1], source: seriesTitle.trim() }
  }

  if (related?.[1]) return { paragraph, link, kind: 'Related guide', title: related[1] }

  if (earlier?.[1]) return { paragraph, link, kind: 'Earlier article', title: earlier[1] }

  if (!/^GitHub Repository$/iu.test(label)) return

  try {
    const url = new URL(href)
    const [owner, repository, ...path] = url.pathname.split('/').filter(Boolean)

    if (url.hostname !== 'github.com' || !owner || !repository) return

    return {
      paragraph,
      link,
      kind: 'Repository',
      title: [repository, ...path].join(' / '),
      source: `github.com / ${owner}`
    }
  } catch {
    // Invalid URLs retain their original paragraph.
    return undefined
  }
}

const createLedger = (references: Reference[], label: string, ariaLabel: string): Element => {
  const rows = references.map(({ link, kind, title, source }) => {
    const titleContent = [text(title)]

    if (source) titleContent.push(element('span', { dataReferenceSource: '' }, [text(source)]))

    link.properties.dataReferenceLink = ''

    link.children = [
      element('span', { dataReferenceKind: '' }, [text(kind)]),
      element('span', { dataReferenceTitle: '' }, titleContent),
      arrowExchange(link.properties.target === '_blank' ? 'up-right' : 'right')
    ]

    return element('li', {}, [link])
  })

  return element('nav', {
    ariaLabel, className: ['not-prose'], dataArticleReferences: ''
  }, [
    element('div', { dataReferenceHeader: '' }, [
      element('p', {}, [text(label)]),
      element('span', { ariaHidden: 'true', dataReferenceRule: '' }, []),
      icon('waypoints')
    ]),
    element('ul', { role: 'list' }, rows)
  ])
}

/** Reuse one static ledger for opening references and explicitly authored closing series connections. */
export const rehypeArticleReferences: Plugin<[], Root> = () => (tree, file) => {
  const path = file.history.at(-1)?.replace(/\\/gu, '/')

  if (!path || !/(?:^|\/)src\/content\/post\//u.test(path) || /(?:^|\/)apps\//u.test(path)) return

  if (tree.children.some(node => node.type === 'element' && node.properties.dataArticleReferences !== undefined)) return

  const last = tree.children.filter(node => node.type !== 'text' || node.value.trim()).at(-1)
  const closing = last?.type === 'element' ? readReference(last) : undefined

  if (closing?.kind === 'Another series') {
    const connection = createLedger([closing], 'Related reading', 'Related reading')

    connection.properties.dataSeriesConnection = ''

    tree.children[tree.children.indexOf(closing.paragraph)] = connection
  }

  const firstHeading = tree.children.find(node => node.type === 'element' && /^h[1-6]$/u.test(node.tagName))
  const opening = firstHeading ? tree.children.slice(0, tree.children.indexOf(firstHeading)) : tree.children

  const references = opening.flatMap(node => {
    const reference = node.type === 'element' ? readReference(node) : undefined

    return reference && reference.kind !== 'Another series' ? [reference] : []
  })

  const recommendations = [...references, ...(closing?.kind === 'Another series' ? [closing] : [])]
  const recommendationUrls = recommendations.flatMap(({ kind, link }) => kind !== 'Repository' && typeof link.properties.href === 'string' ? [link.properties.href] : [])

  if (recommendationUrls.length > 0) {
    file.data.astro ??= { frontmatter: {} }

    file.data.astro.frontmatter ??= {}

    file.data.astro.frontmatter.articleRecommendationUrls = [...new Set(recommendationUrls)]
  }

  if (references.length === 0) return

  const order: Record<Reference['kind'], number> = { 'Related guide': 0, Repository: 1, 'Earlier article': 2, 'Another series': 3 }
  const paragraphs = new Set(references.map(reference => reference.paragraph))
  const ledger = createLedger(references.sort((a, b) => order[a.kind] - order[b.kind]), 'With this guide', 'References for this article')

  tree.children = tree.children.filter(node => node.type !== 'element' || !paragraphs.has(node))

  const insertion = firstHeading ? tree.children.indexOf(firstHeading) : tree.children.length

  tree.children.splice(insertion, 0, ledger)
}
