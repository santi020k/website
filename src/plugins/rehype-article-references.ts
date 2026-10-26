import { getLumenIcon, type LumenIconName, type LumenIconNode } from '@santi020k/lumen-core'
import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

interface Reference {
  paragraph: Element
  link: Element
  kind: 'Related guide' | 'Repository' | 'Earlier article'
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

const icon = (name: LumenIconName): Element => element('svg', {
  ariaHidden: 'true',
  focusable: 'false',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24'
}, getLumenIcon(name)?.node.map(iconNode) ?? [])

const readReference = (paragraph: Element): Reference | undefined => {
  // Only the legacy, explicitly labeled standalone references opt in.
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

/** Group opening references without reinterpreting inline links or links within chapters. */
export const rehypeArticleReferences: Plugin<[], Root> = () => (tree, file) => {
  const path = file.history.at(-1)?.replace(/\\/gu, '/')

  if (!path || !/(?:^|\/)src\/content\/post\//u.test(path) || /(?:^|\/)apps\//u.test(path)) return

  if (tree.children.some(node => node.type === 'element' && node.properties.dataArticleReferences !== undefined)) return

  const firstHeading = tree.children.find(node => node.type === 'element' && /^h[1-6]$/u.test(node.tagName))
  const opening = firstHeading ? tree.children.slice(0, tree.children.indexOf(firstHeading)) : tree.children

  const references = opening.flatMap(node => {
    const reference = node.type === 'element' ? readReference(node) : undefined

    return reference ? [reference] : []
  })

  if (references.length === 0) return

  const order: Record<Reference['kind'], number> = { 'Related guide': 0, Repository: 1, 'Earlier article': 2 }
  const paragraphs = new Set(references.map(reference => reference.paragraph))

  const rows = references.sort((a, b) => order[a.kind] - order[b.kind]).map(({ link, kind, title, source }) => {
    const titleContent = [text(title)]

    if (source) titleContent.push(element('span', { dataReferenceSource: '' }, [text(source)]))

    link.properties.dataReferenceLink = ''

    link.children = [
      element('span', { dataReferenceKind: '' }, [text(kind)]),
      element('span', { dataReferenceTitle: '' }, titleContent),
      icon(link.properties.target === '_blank' ? 'arrow-up-right' : 'arrow-right')
    ]

    return element('li', {}, [link])
  })

  const ledger = element('nav', {
    ariaLabel: 'References for this article', className: ['not-prose'], dataArticleReferences: ''
  }, [
    element('div', { dataReferenceHeader: '' }, [
      element('p', {}, [text('With this guide')]),
      element('span', { ariaHidden: 'true', dataReferenceRule: '' }, []),
      icon('waypoints')
    ]),
    element('ul', { role: 'list' }, rows)
  ])

  tree.children = tree.children.filter(node => node.type !== 'element' || !paragraphs.has(node))

  const insertion = firstHeading ? tree.children.indexOf(firstHeading) : tree.children.length

  tree.children.splice(insertion, 0, ledger)
}
