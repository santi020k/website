import type { Root } from 'hast'
import type { Plugin } from 'unified'

/** Keep section titles in one text flow beside their decorative trailing rule. */
export const rehypeArticleHeadings: Plugin<[], Root> = () => (tree, file) => {
  const sourcePath = file.history.at(-1)?.replace(/\\/gu, '/')

  if (!sourcePath || !/(?:^|\/)src\/content\/post\//u.test(sourcePath) || /(?:^|\/)apps\//u.test(sourcePath)) return

  for (const node of tree.children) {
    // Component, quote, and callout headings retain their own composition.
    if (node.type !== 'element' || node.tagName !== 'h2' || node.properties.dataArticleSectionHeading !== undefined) continue

    node.properties.dataArticleSectionHeading = ''

    node.children = [{
      type: 'element',
      tagName: 'span',
      properties: { dataArticleHeadingText: '' },
      children: node.children
    }]
  }
}
