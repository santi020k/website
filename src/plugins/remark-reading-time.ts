import type { Root } from 'mdast'
import { toString as mdastToString } from 'mdast-util-to-string'
import getReadingTime from 'reading-time'
import type { VFile } from 'vfile'

/** Extends VFile.data with Astro's injected frontmatter shape. */
interface AstroVFileData {
  astro?: {
    frontmatter: Record<string, unknown>
  }
}

export const remarkReadingTime = () => (tree: Root, file: VFile) => {
  const textOnPage = mdastToString(tree)
  const readingTime = getReadingTime(textOnPage)

  const data = file.data as AstroVFileData
  data.astro ??= { frontmatter: {} }
  data.astro.frontmatter['readingTime'] = readingTime.text
}
