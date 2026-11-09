import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

import { type Locale, localizePath } from '../i18n'
import { articleTranslator } from '../i18n/article-copy'
import { getPostSlug } from '../utils/posts'

export interface PrintReference {
  href: string
  label: string
}

const textContent = (node: ElementContent): string => {
  if (node.type === 'text') return node.value

  if (node.type !== 'element' || node.tagName === 'svg' || node.properties.ariaHidden === 'true') return ''

  return node.children.map(textContent).join('')
}

const marker = (number: number, locale: Locale): Element => ({
  type: 'element',
  tagName: 'sup',
  properties: { dataPrintReference: '' },
  children: [{
    type: 'element',
    tagName: 'a',
    properties: { href: `#article-print-reference-${number}`, ariaLabel: articleTranslator(locale)('article.printReference', { number }) },
    children: [{ type: 'text', value: String(number) }]
  }]
})

/** Static print references for authored prose; code, components and navigation keep their contracts. */
export const rehypePrintReferences: Plugin<[{ site: string }], Root> = ({ site }) => (tree, file) => {
  const path = file.history.at(-1)?.replace(/\\/gu, '/')
  const source = path?.match(/(?:^|\/)src\/content\/post\/(.+)$/u)?.[1]

  if (!source || /(?:^|\/)apps\//u.test(path)) return

  if (file.data.astro?.frontmatter?.articlePrintReferences !== undefined) return

  const locale = /\.es\.mdx?$/u.test(source) ? 'es' : 'en'
  const originalSource = source.replace(/\.es(?=\.mdx?$)/u, '')
  const page = new URL(localizePath(`/blog/${getPostSlug(originalSource)}/`, locale), site)
  const references: PrintReference[] = []
  const numbers = new Map<string, number>()
  const excluded = new Set(['pre', 'code', 'nav', 'button', 'script', 'style', 'svg', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

  const readLink = (link: Element): PrintReference | undefined => {
    const href = link.properties.href
    const label = link.children.map(textContent).join('').replace(/\s+/gu, ' ').trim()

    if (typeof href !== 'string' || !href.trim() || href.trim().startsWith('#') || !label) return

    if (link.properties.dataFootnoteRef !== undefined || link.properties.dataFootnoteBackref !== undefined) return

    try {
      const url = new URL(href, page)

      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return

      if (url.origin === page.origin && url.pathname === page.pathname && url.search === page.search) return

      // A URL already written in the prose remains useful on paper without an extra note.
      const readable = (value: string) => value.replace(/^https?:\/\//iu, '').replace(/\/$/u, '')

      if (readable(label) === readable(url.href)) return

      return { href: url.href, label }
    } catch {
      return undefined
    }
  }

  const walk = (parent: Root | Element) => {
    for (let index = 0; index < parent.children.length; index++) {
      const node = parent.children[index]

      if (node?.type !== 'element') continue

      if (excluded.has(node.tagName) || node.properties.hidden || node.properties.ariaHidden === 'true' || node.properties.dataUiCode !== undefined || node.properties['data-ui-code'] !== undefined) continue

      if (node.tagName === 'a') {
        const reference = readLink(node)

        if (!reference) continue

        let number = numbers.get(reference.href)

        if (number === undefined) {
          number = references.push(reference)

          numbers.set(reference.href, number)
        }

        parent.children.splice(index + 1, 0, marker(number, locale))

        index++
      } else walk(node)
    }
  }

  walk(tree)

  file.data.astro ??= { frontmatter: {} }

  file.data.astro.frontmatter ??= {}

  file.data.astro.frontmatter.articlePrintReferences = references
}
