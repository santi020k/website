import { describe, expect, test } from 'vitest'

import { getAllTags, getBlogBrowseTags, getTopTags } from '../tags'

const makePosts = (tagSets: string[][]) => tagSets.map(tags => ({ data: { tags } }))

// ─── getTopTags ───────────────────────────────────────────────────────────────

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
})

describe('getTopTags', () => {
  test('counts tag occurrences across all posts', () => {
    const posts = makePosts([['ts', 'react'], ['ts', 'astro'], ['react']])
    const result = getTopTags(posts)

    const map = Object.fromEntries(result)
    expect(map.ts).toBe(2)
    expect(map.react).toBe(2)
    expect(map.astro).toBe(1)
  })

  test('sorts tags by frequency descending', () => {
    const posts = makePosts([['a'], ['b'], ['b'], ['c'], ['c'], ['c']])
    const tags = getTopTags(posts).map(([tag]) => tag)

    expect(tags[0]).toBe('c')
    expect(tags[1]).toBe('b')
    expect(tags[2]).toBe('a')
  })

  test('respects the default limit of 8', () => {
    const posts = makePosts([['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9']])
    expect(getTopTags(posts)).toHaveLength(8)
  })

  test('respects a custom limit', () => {
    const posts = makePosts([['a', 'b', 'c', 'd', 'e']])
    expect(getTopTags(posts, 3)).toHaveLength(3)
  })

  test('returns all tags when the total is under the limit', () => {
    const posts = makePosts([['alpha', 'beta']])
    expect(getTopTags(posts)).toHaveLength(2)
  })

  test('returns an empty array for posts with no tags', () => {
    expect(getTopTags(makePosts([[]]))).toEqual([])
  })

  test('returns an empty array when given no posts', () => {
    expect(getTopTags([])).toEqual([])
  })

  test('does not mutate the original post data', () => {
    const posts = makePosts([['x', 'y']])
    const firstPost = posts[0]
    if (!firstPost) throw new Error('test setup error')
    const original = [...firstPost.data.tags]
    getTopTags(posts)
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
