/**
 * Counts tag occurrences across a list of posts and returns the top N tags
 * sorted by frequency (descending). Posts must expose a `data.tags` string array.
 */
export const getAllTags = (
  posts: { data: { tags: string[] } }[]
): [string, number][] => [...posts
  .flatMap(post => post.data.tags)
  .reduce((acc, tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1), new Map<string, number>())]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

export const getTopTags = (
  posts: { data: { tags: string[] } }[],
  limit = 8
): [string, number][] => getAllTags(posts).slice(0, limit)
