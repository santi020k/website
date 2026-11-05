// Heavy inspiration from starlight: https://github.com/withastro/starlight/blob/main/packages/starlight/utils/generateToC.ts
import type { MarkdownHeading } from 'astro'

/** A heading entry enriched with nested child headings for the ToC tree. */
export interface TocItem extends MarkdownHeading {
  children: TocItem[]
}

interface TocOpts {

  /** Deepest heading level to include (inclusive). Defaults to 6. */
  maxHeadingLevel?: number | undefined

  /** Shallowest heading level to include (inclusive). Defaults to 1. */
  minHeadingLevel?: number | undefined
}

/** Recursively injects a ToC entry as deep in the tree as its `depth` requires. */
const injectChild = (items: TocItem[], item: TocItem): void => {
  const lastItem = items.at(-1)

  if (!lastItem || lastItem.depth >= item.depth) {
    items.push(item)
  } else {
    injectChild(lastItem.children, item)
  }
}

/**
 * Converts a flat list of Markdown headings into a nested tree suitable
 * for rendering a Table of Contents.
 *
 * @param headings - The `headings` array returned by Astro for a content entry.
 * @param opts - Optional level constraints (`minHeadingLevel` / `maxHeadingLevel`).
 * @returns A nested `TocItem[]` tree.
 */
export const generateToc = (
  headings: readonly MarkdownHeading[],
  { maxHeadingLevel = 6, minHeadingLevel = 1 }: TocOpts = {}
): TocItem[] => {
  const bodyHeadings = headings.filter(
    ({ depth }) => depth >= minHeadingLevel && depth <= maxHeadingLevel
  )

  const toc: TocItem[] = []

  for (const heading of bodyHeadings) injectChild(toc, { ...heading, children: [] })

  return toc
}
