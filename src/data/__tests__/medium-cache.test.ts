import { describe, expect, test } from 'vitest'

import { mediumPostsCache } from '../medium-cache'

describe('mediumPostsCache', () => {
  test('is a non-empty array', () => {
    expect(mediumPostsCache.length).toBeGreaterThan(0)
  })

  test('every post has required fields', () => {
    for (const post of mediumPostsCache) {
      expect(post.title, 'post missing title').toBeTruthy()
      expect(post.link, `"${post.title}" missing link`).toBeTruthy()
      expect(post.slug, `"${post.title}" missing slug`).toBeTruthy()
      expect(post.author, `"${post.title}" missing author`).toBeTruthy()
      expect(post.publishedAt, `"${post.title}" missing publishedAt`).toBeTruthy()
    }
  })

  test('every post has a tags array', () => {
    for (const post of mediumPostsCache) {
      expect(Array.isArray(post.tags)).toBe(true)
    }
  })

  test('every post has a non-empty excerpt', () => {
    for (const post of mediumPostsCache) {
      expect(post.excerpt, `"${post.title}" missing excerpt`).toBeTruthy()
    }
  })

  test('slugs are unique across all posts', () => {
    const slugs = mediumPostsCache.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
