/**
 * Normalizes a post ID from the content collection into a URL-friendly slug.
 * Handles nested directory structures and "index" filenames.
 *
 * Examples:
 * - "my-post" -> "my-post"
 * - "2024/my-post" -> "my-post"
 * - "2026/my-post/index" -> "my-post"
 */
export const getPostSlug = (id: string): string => {
  // 1. Remove file extension (e.g., .md, .mdx)
  const withoutExtension = id.replace(/\.mdx?$/, '')
  // 2. Remove trailing /index if it exists
  const base = withoutExtension.replace(/\/index$/, '')
  // 3. Get the last segment of the path
  const segments = base.split('/')

  return segments[segments.length - 1] ?? id
}

/**
 * Throws when several post IDs resolve to one URL, such as `2025/my-post` and
 * `2026/my-post/index`. Astro would otherwise render only one of them there.
 */
export const assertUniquePostPaths = (posts: readonly { id: string }[], getPath: (id: string) => string): void => {
  const idsByPath = new Map<string, string[]>()

  for (const { id } of posts) {
    const path = getPath(id)
    const ids = idsByPath.get(path)

    if (ids) ids.push(id)
    else idsByPath.set(path, [id])
  }

  const conflicts = [...idsByPath]
    .filter(([, ids]) => ids.length > 1)
    .map(([path, ids]) => `${path} (${ids.join(', ')})`)

  if (conflicts.length > 0) {
    throw new Error(`Blog posts share a URL: ${conflicts.join('; ')}`)
  }
}
