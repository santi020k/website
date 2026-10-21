import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

const hasContent = (node: ElementContent): boolean => node.type === 'text' ? Boolean(node.value.trim()) : node.type === 'element'

const wrapper = (property: string, children: ElementContent[]): Element => ({
  children,
  properties: { [property]: '' },
  tagName: 'div',
  type: 'element'
})

/** Separate authored leads from their explanations without rewriting Markdown copy. */
export const rehypeProjectLedger: Plugin<[], Root> = () => (tree, file) => {
  const sourcePath = file.history.at(-1)

  if (!sourcePath || !/(?:^|\/)src\/content\/project\//u.test(sourcePath.replace(/\\/gu, '/'))) return

  for (const list of tree.children) {
    if (list.type !== 'element' || !['ul', 'ol'].includes(list.tagName) || list.properties.dataProjectLedger !== undefined) continue

    list.properties.dataProjectLedger = ''

    list.properties.role = 'list'

    for (const item of list.children) {
      if (item.type !== 'element' || item.tagName !== 'li') continue

      const first = item.children.find(hasContent)
      const paragraph = first?.type === 'element' && first.tagName === 'p' ? first : undefined
      const content = paragraph?.children ?? item.children
      const leadIndex = content.findIndex(hasContent)
      const lead = content[leadIndex]
      const row = wrapper('dataProjectLedgerRow', [])

      if (lead?.type === 'element' && lead.tagName === 'strong') {
        row.children.push(wrapper('dataProjectLedgerLead', content.slice(0, leadIndex + 1)))

        const tail = content.slice(leadIndex + 1)
        const remainder = paragraph ? item.children.slice(item.children.indexOf(paragraph) + 1) : []

        if (tail.some(hasContent) || remainder.some(hasContent)) {
          row.properties.dataProjectLedgerSplit = ''

          const explanation = paragraph && tail.some(hasContent) ? [{ ...paragraph, children: tail }] : tail

          row.children.push(wrapper('dataProjectLedgerDetail', [...explanation, ...remainder]))
        } else {
          // Retain trailing whitespace/comments without creating an empty detail column.
          row.children.push(...tail, ...remainder)
        }
      } else {
        row.children.push(wrapper('dataProjectLedgerDetail', item.children))
      }

      item.children = [...(paragraph ? item.children.slice(0, item.children.indexOf(paragraph)) : []), row]
    }
  }
}
