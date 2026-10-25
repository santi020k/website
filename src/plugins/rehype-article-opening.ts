import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

const element = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element', tagName, properties, children
})

/** Pair the authored opening paragraph with its format, preserving preceding update notes. */
export const rehypeArticleOpening: Plugin<[], Root> = () => (tree, file) => {
  const sourcePath = file.history.at(-1)?.replace(/\\/gu, '/')

  if (!sourcePath || !/(?:^|\/)src\/content\/post\//u.test(sourcePath) || /(?:^|\/)apps\//u.test(sourcePath)) return

  for (const [index, node] of tree.children.entries()) {
    if (node.type !== 'element') continue

    // Do not turn a section's first paragraph into an article introduction, or wrap twice.
    if (/^h[1-6]$/u.test(node.tagName) || node.properties.dataArticleMarginLead !== undefined) return

    if (node.tagName !== 'p') continue

    if (node.children.some(child => child.type === 'element' && ['img', 'picture', 'video', 'iframe'].includes(child.tagName))) return

    const postType: unknown = file.data.astro?.frontmatter?.postType
    const format = typeof postType === 'string' && postType.trim() ? postType.trim() : 'Article'

    node.properties.dataArticleLead = ''

    tree.children[index] = element('div', { dataArticleMarginLead: '', id: 'article-opening' }, [
      element('div', { dataArticleLeadLayout: '' }, [
        element('p', { dataArticleFormat: '' }, [{ type: 'text', value: format }]),
        node
      ])
    ])

    return
  }
}
