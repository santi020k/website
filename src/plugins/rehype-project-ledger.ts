import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

const hasContent = (node: ElementContent): boolean => node.type === 'text' ? Boolean(node.value.trim()) : node.type === 'element'

const wrapper = (property: string, children: ElementContent[]): Element => ({
  children,
  properties: { [property]: '' },
  tagName: 'div',
  type: 'element'
})

const itemParts = (item: Element) => {
  const first = item.children.find(hasContent)
  const paragraph = first?.type === 'element' && first.tagName === 'p' ? first : undefined
  const content = paragraph?.children ?? item.children
  const leadIndex = content.findIndex(hasContent)
  const lead = content[leadIndex]
  const tail = content.slice(leadIndex + 1)
  const remainder = paragraph ? item.children.slice(item.children.indexOf(paragraph) + 1) : []

  return { content, lead, leadIndex, paragraph, remainder, tail }
}

/** Shared editorial composition; article checklists require a label and explanation in every row. */
export const applyLedger = (list: Element, kind: 'Project' | 'Checklist'): void => {
  const prefix = `data${kind}Ledger`

  if (list.properties[prefix] !== undefined) return

  const items = list.children.filter((node): node is Element => node.type === 'element' && node.tagName === 'li')

  if (kind === 'Checklist' && (!items.length || !items.every(item => {
    const { lead, tail, remainder } = itemParts(item)

    return lead?.type === 'element' && lead.tagName === 'strong' && lead.children.some(hasContent) &&
      (tail.some(hasContent) || remainder.some(hasContent))
  }))) return

  list.properties[prefix] = ''

  list.properties.role = 'list'

  for (const item of items) {
    const { content, lead, leadIndex, paragraph, tail, remainder } = itemParts(item)
    const row = wrapper(`${prefix}Row`, [])

    if (lead?.type === 'element' && lead.tagName === 'strong') {
      row.children.push(wrapper(`${prefix}Lead`, content.slice(0, leadIndex + 1)))

      if (tail.some(hasContent) || remainder.some(hasContent)) {
        row.properties[`${prefix}Split`] = ''

        const explanation = paragraph && tail.some(hasContent) ? [{ ...paragraph, children: tail }] : tail

        row.children.push(wrapper(`${prefix}Detail`, [...explanation, ...remainder]))
      } else {
        // Retain trailing whitespace/comments without creating an empty detail column.
        row.children.push(...tail, ...remainder)
      }
    } else {
      row.children.push(wrapper(`${prefix}Detail`, item.children))
    }

    item.children = [...(paragraph ? item.children.slice(0, item.children.indexOf(paragraph)) : []), row]
  }
}

/** Separate authored leads from their explanations without rewriting Markdown copy. */
export const rehypeProjectLedger: Plugin<[], Root> = () => (tree, file) => {
  const sourcePath = file.history.at(-1)

  if (!sourcePath || !/(?:^|\/)src\/content\/project\//u.test(sourcePath.replace(/\\/gu, '/'))) return

  for (const list of tree.children) {
    if (list.type === 'element' && ['ul', 'ol'].includes(list.tagName)) applyLedger(list, 'Project')
  }
}
