// Heavy inspiration from starlight: https://github.com/withastro/starlight/blob/main/packages/starlight/utils/generateToC.ts
import type { MarkdownHeading } from 'astro'

export interface TocItem extends MarkdownHeading {
  children: TocItem[]
}

interface TocOpts {
  maxHeadingLevel?: number | undefined
  minHeadingLevel?: number | undefined
}

/** Inject a ToC entry as deep in the tree as its `depth` property requires. */
const injectChild = (items: TocItem[], item: TocItem): void => {
  const lastItem = items.at(-1)

  if (!lastItem || lastItem.depth >= item.depth) {
    items.push(item)
  } else {
    injectChild(lastItem.children, item)
  }
}

export const generateToc = (
  headings: readonly MarkdownHeading[],
  { maxHeadingLevel = 6, minHeadingLevel = 1 }: TocOpts = {}
) => {
  // by default this ignores/filters out h1 and h5 heading(s)
  const bodyHeadings = headings.filter(
    ({ depth }) => depth >= minHeadingLevel && depth <= maxHeadingLevel
  )

  const toc: TocItem[] = []

  for (const heading of bodyHeadings) injectChild(toc, { ...heading, children: [] })

  return toc
}
