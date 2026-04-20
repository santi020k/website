import { describe, expect, it } from 'vitest'

import { mediumPostsCache } from '../medium-cache'

describe('mediumPostsCache', () => {
  it('is a non-empty array', () => {
    expect(mediumPostsCache.length).toBeGreaterThan(0)
  })

  it('every post has required fields', () => {
    for (const post of mediumPostsCache) {
      expect(post.title, 'post missing title').toBeTruthy()
      expect(post.link, `"${post.title}" missing link`).toBeTruthy()
      expect(post.slug, `"${post.title}" missing slug`).toBeTruthy()
      expect(post.author, `"${post.title}" missing author`).toBeTruthy()
      expect(post.publishedAt, `"${post.title}" missing publishedAt`).toBeTruthy()
    }
  })

  it('every post has a tags array', () => {
    for (const post of mediumPostsCache) {
      expect(Array.isArray(post.tags)).toBe(true)
    }
  })

  it('every post has a non-empty excerpt', () => {
    for (const post of mediumPostsCache) {
      expect(post.excerpt, `"${post.title}" missing excerpt`).toBeTruthy()
    }
  })

  it('slugs are unique across all posts', () => {
    const slugs = mediumPostsCache.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
