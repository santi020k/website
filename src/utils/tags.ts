/**
 * Counts tag occurrences across a list of posts and returns all tags
 * sorted by frequency (descending). Posts must expose a `data.tags` string array.
 */
export const getAllTags = (
  posts: { data: { tags: string[] } }[]
): [string, number][] => [...posts
  .flatMap(post => post.data.tags)
  .reduce((acc, tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1), new Map<string, number>())]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

/** Keep personal interests discoverable alongside the most frequent software topics. */
export const getBlogBrowseTags = (tags: [string, number][]): [string, number][] => {
  const interests = ['reading', 'gaming']
  const featured = tags.filter(([tag]) => interests.includes(tag))
  const remaining = tags.filter(([tag]) => !interests.includes(tag))

  return [...featured, ...remaining].slice(0, 8)
}
