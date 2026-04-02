import type { Root } from 'mdast'
import { toString as mdastToString } from 'mdast-util-to-string'
import getReadingTime from 'reading-time'
import type { VFile } from 'vfile'

export const remarkReadingTime = () => (tree: Root, file: VFile) => {
  const textOnPage = mdastToString(tree)
  const readingTime = getReadingTime(textOnPage)

  file.data.astro ??= { frontmatter: {} }

  // @ts-expect-error - readingTime is added to frontmatter
  file.data.astro.frontmatter.readingTime = readingTime.text
}
