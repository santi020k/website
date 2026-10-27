import { describe, expect, test } from 'vitest'

import { getPostPath } from '../links'
import { assertUniquePostPaths, getPostSlug } from '../posts'

const posts = (...ids: string[]) => ids.map(id => ({ id }))

describe('post URLs', () => {
  test.each([
    ['my-post', 'my-post'],
    ['2024/my-post', 'my-post'],
    ['2026/my-post/index', 'my-post'],
    ['2026/my-post.mdx', 'my-post']
  ])('derives the slug for %s', (id, slug) => {
    expect(getPostSlug(id)).toBe(slug)
  })

  test('accepts distinct published URLs', () => {
    expect(() => {
      assertUniquePostPaths(posts('2024/first-post/index', '2025/second-post', 'third-post'), getPostPath)
    }).not.toThrow()
  })

  test('names every ID that shares a URL across years', () => {
    expect(() => {
      assertUniquePostPaths(posts('2024/shared/index', '2027/shared/index'), getPostPath)
    }).toThrow('Blog posts share a URL: /blog/shared/ (2024/shared/index, 2027/shared/index)')
  })

  test('treats index and direct Markdown IDs as the same URL', () => {
    expect(() => {
      assertUniquePostPaths(posts('2025/my-post', '2026/my-post/index', 'unique'), getPostPath)
    }).toThrow('Blog posts share a URL: /blog/my-post/ (2025/my-post, 2026/my-post/index)')
  })

  test('reports each conflicting URL once', () => {
    expect(() => {
      assertUniquePostPaths(posts('2024/a/index', '2025/a', '2024/b', '2026/b/index', 'b'), getPostPath)
    }).toThrow('Blog posts share a URL: /blog/a/ (2024/a/index, 2025/a); /blog/b/ (2024/b, 2026/b/index, b)')
  })
})
