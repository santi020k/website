import type { MarkdownHeading } from 'astro'
import type { DefaultTreeAdapterTypes } from 'parse5'
import { parseFragment } from 'parse5'

/** Keep permanent fragment IDs while letting the translated outline supply its own labels. */
export const translatedHeadings = (original: MarkdownHeading[], translated: MarkdownHeading[]) => {
  if (original.length !== translated.length) throw new Error('Translation must preserve the original heading structure.')

  const ids = new Map<string, string>()

  const headings = translated.map((heading, index) => {
    const source = original[index]

    if (source?.depth !== heading.depth) throw new Error(`Translation heading ${index + 1} has a different depth.`)

    ids.set(heading.slug, source.slug)

    return { ...heading, slug: source.slug }
  })

  return { headings, ids }
}

/** Edit heading attributes by source offsets, leaving code, scripts, and authored markup intact. */
export const preserveHeadingIds = (html: string, ids: ReadonlyMap<string, string>): string => {
  if (!ids.size) return html

  const edits: { start: number, end: number, value: string }[] = []

  const visit = (node: DefaultTreeAdapterTypes.Node) => {
    if ('tagName' in node && /^h[1-6]$/u.test(node.tagName)) {
      const id = node.attrs.find(attribute => attribute.name === 'id')?.value
      const replacement = id ? ids.get(id) : undefined
      const location = node.sourceCodeLocation?.attrs?.id

      if (replacement && location) edits.push({ start: location.startOffset, end: location.endOffset, value: `id="${replacement}"` })
    }

    if ('childNodes' in node) node.childNodes.forEach(visit)
  }

  visit(parseFragment(html, { sourceCodeLocationInfo: true }))

  return edits.sort((a, b) => b.start - a.start).reduce((result, edit) => {
    const before = result.slice(0, edit.start)
    const after = result.slice(edit.end)

    return before + edit.value + after
  }, html)
}
