import type { ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

import { applyLedger } from './rehype-project-ledger'

const textContent = (node: ElementContent): string => {
  if (node.type === 'text') return node.value

  return node.type === 'element' ? node.children.map(textContent).join('') : ''
}

/** Reuse Ownership ledger for labeled article checklists without changing ordinary lists. */
export const rehypeArticleChecklists: Plugin<[], Root> = () => (tree, file) => {
  const sourcePath = file.history.at(-1)?.replace(/\\/gu, '/')

  if (!sourcePath || !/(?:^|\/)src\/content\/post\//u.test(sourcePath) || /(?:^|\/)apps\//u.test(sourcePath)) return

  const sections: { depth: number, checklist: boolean }[] = []

  for (const node of tree.children) {
    if (node.type !== 'element') continue

    if (/^h[1-6]$/u.test(node.tagName)) {
      const depth = Number(node.tagName.slice(1))

      while (sections.length && (sections.at(-1)?.depth ?? 0) >= depth) sections.pop()

      sections.push({ depth, checklist: /\bchecklists?\b/iu.test(textContent(node)) })
    } else if (sections.some(section => section.checklist) && ['ul', 'ol'].includes(node.tagName)) {
      applyLedger(node, 'Checklist')
    }
  }
}
