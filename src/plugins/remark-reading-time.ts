import { toString as mdastToString } from 'mdast-util-to-string'
import getReadingTime from 'reading-time'

// TODO: Temporal fix
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const remarkReadingTime = () => (tree: any, { data }: any) => {
  const textOnPage = mdastToString(tree)
  const readingTime = getReadingTime(textOnPage)

  data.astro.frontmatter.readingTime = readingTime.text
}
