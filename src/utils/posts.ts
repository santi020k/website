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
  // Remove trailing /index if it exists
  const base = id.replace(/\/index$/, '')
  // Get the last segment of the path
  const segments = base.split('/')

  return segments[segments.length - 1] ?? id
}
