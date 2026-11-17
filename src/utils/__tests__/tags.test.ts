import { describe, expect, test } from 'vitest'

import { getAllTags, getBlogBrowseTags, getBlogTopicLabel, getRelatedBlogTags } from '../tags'

const makePosts = (tagSets: string[][]) => tagSets.map(tags => ({ data: { tags } }))

describe('getRelatedBlogTags', () => {
  test('ranks by shared articles, excludes the current topic, and shows destination totals', () => {
    const posts = makePosts([
      ['current', 'related'],
      ['current', 'related'],
      ['current', 'popular'],
      ['popular'],
      ['popular'],
      ['popular'],
      ['unrelated']
    ])

    expect(getRelatedBlogTags(posts, 'current')).toEqual([['related', 2], ['popular', 4]])
  })

  test('breaks shared-article ties alphabetically and limits the set to four', () => {
    const posts = makePosts([['current', 'zeta', 'beta', 'delta', 'alpha', 'gamma'], ['zeta']])

    expect(getRelatedBlogTags(posts, 'current')).toEqual([
      ['alpha', 1], ['beta', 1], ['delta', 1], ['gamma', 1]
    ])
  })

  test('counts each shared article once even when its tags repeat', () => {
    const posts = makePosts([['current', 'beta', 'beta', 'alpha'], ['current', 'alpha']])

    expect(getRelatedBlogTags(posts, 'current').map(([tag]) => tag)).toEqual(['alpha', 'beta'])
  })

  test('uses the full topic archive, including articles beyond the first page', () => {
    const posts = makePosts([...Array.from({ length: 12 }, () => ['current']), ['current', 'later']])

    expect(getRelatedBlogTags(posts, 'current')).toEqual([['later', 1]])
  })

  test('omits unrelated filler for isolated, unknown, and empty topics', () => {
    expect(getRelatedBlogTags(makePosts([['alone'], ['other']]), 'alone')).toEqual([])
    expect(getRelatedBlogTags(makePosts([['other']]), 'missing')).toEqual([])
    expect(getRelatedBlogTags([], 'missing')).toEqual([])
    expect(getRelatedBlogTags(makePosts([['current', 'only']]), 'current')).toEqual([['only', 1]])
  })

  test('does not change the input order or tag arrays', () => {
    const posts = makePosts([['current', 'beta'], ['alpha', 'current']])
    const original = structuredClone(posts)

    getRelatedBlogTags(posts, 'current')
    expect(posts).toEqual(original)
  })
})

describe('getBlogTopicLabel', () => {
  test.each([
    ['typescript', 'TypeScript'],
    ['nextjs', 'Next.js'],
    ['eslint', 'ESLint'],
    ['css', 'CSS'],
    ['seo', 'SEO'],
    ['openapi', 'OpenAPI'],
    ['i18n', 'i18n'],
    ['jetpack-compose', 'Jetpack Compose'],
    ['cross-platform', 'Cross-platform'],
    ['developer-experience', 'Developer experience'],
    ['open-source', 'Open source'],
    ['reading', 'Reading'],
    ['React', 'React'],
    ['', '']
  ])('formats %s as a readable topic label', (tag, label) => {
    expect(getBlogTopicLabel(tag)).toBe(label)
  })
})

describe('getAllTags', () => {
  test('returns every tag sorted by frequency descending', () => {
    const posts = makePosts([['b'], ['a'], ['b'], ['c'], ['c'], ['c']])

    expect(getAllTags(posts)).toEqual([
      ['c', 3],
      ['b', 2],
      ['a', 1]
    ])
  })

  test('breaks ties alphabetically for deterministic output', () => {
    const posts = makePosts([['beta'], ['alpha']])

    expect(getAllTags(posts)).toEqual([
      ['alpha', 1],
      ['beta', 1]
    ])
  })

  test('counts tag occurrences across all posts', () => {
    const posts = makePosts([['ts', 'react'], ['ts', 'astro'], ['react']])
    const result = getAllTags(posts)

    const map = Object.fromEntries(result)
    expect(map.ts).toBe(2)
    expect(map.react).toBe(2)
    expect(map.astro).toBe(1)
  })

  test('returns all available tags', () => {
    const posts = makePosts([['alpha', 'beta']])
    expect(getAllTags(posts)).toHaveLength(2)
  })

  test('returns an empty array for posts with no tags', () => {
    expect(getAllTags(makePosts([[]]))).toEqual([])
  })

  test('returns an empty array when given no posts', () => {
    expect(getAllTags([])).toEqual([])
  })

  test('does not mutate the original post data', () => {
    const posts = makePosts([['x', 'y']])
    const firstPost = posts[0]
    if (!firstPost) throw new Error('test setup error')
    const original = [...firstPost.data.tags]
    getAllTags(posts)
    expect(firstPost.data.tags).toEqual(original)
  })
})

describe('getBlogBrowseTags', () => {
  test('keeps smaller personal topics visible without duplicating or changing counts', () => {
    const tags: [string, number][] = [
      ['typescript', 30],
      ['astro', 20],
      ['react', 18],
      ['testing', 12],
      ['architecture', 10],
      ['automation', 9],
      ['css', 8],
      ['html', 7],
      ['gaming', 1],
      ['reading', 1]
    ]
    const original = structuredClone(tags)
    const result = getBlogBrowseTags(tags)

    expect(result).toHaveLength(8)
    expect(result.slice(0, 2)).toEqual([
      ['gaming', 1],
      ['reading', 1]
    ])
    expect(result.slice(2)).toEqual(tags.slice(0, 6))
    expect(new Set(result.map(([tag]) => tag)).size).toBe(8)
    expect(tags).toEqual(original)
  })

  test('does not invent empty topics', () => {
    expect(getBlogBrowseTags([])).toEqual([])
    expect(getBlogBrowseTags([['astro', 2]])).toEqual([['astro', 2]])
  })
})
