import { describe, expect, it } from 'vitest'

import { getAdjacentSeriesPosts, sortSeriesPosts } from '../series'

const expectDefined = <T>(value: T | undefined): T => {
  expect(value).toBeDefined()

  if (value === undefined) {
    throw new Error('Expected value to be defined')
  }

  return value
}

const buildPost = (id: string, publishDate: string, seriesOrder?: number) => ({
  data: {
    publishDate: new Date(publishDate),
    seriesOrder
  },
  id
})

// ─── sortSeriesPosts ──────────────────────────────────────────────────────────

describe('sortSeriesPosts', () => {
  it('sorts by explicit series order before publish date', () => {
    const posts = [
      buildPost('third', '2024-03-03', 3),
      buildPost('first', '2024-03-01', 1),
      buildPost('second', '2024-03-02', 2)
    ]

    expect(sortSeriesPosts(posts).map(post => post.id)).toEqual(['first', 'second', 'third'])
  })

  it('falls back to publish date when no order is present', () => {
    const posts = [
      buildPost('later', '2024-04-18'),
      buildPost('earlier', '2024-03-21')
    ]

    expect(sortSeriesPosts(posts).map(post => post.id)).toEqual(['earlier', 'later'])
  })

  it('places ordered posts before unordered ones', () => {
    const posts = [
      buildPost('unordered', '2024-01-01'),
      buildPost('ordered', '2024-01-02', 1)
    ]

    expect(expectDefined(sortSeriesPosts(posts)[0]).id).toBe('ordered')
  })

  it('does not mutate the original array', () => {
    const posts = [
      buildPost('b', '2024-02-01', 2),
      buildPost('a', '2024-01-01', 1)
    ]
    const original = [...posts]
    sortSeriesPosts(posts)
    expect(posts).toEqual(original)
  })

  it('handles an empty array', () => {
    expect(sortSeriesPosts([])).toEqual([])
  })

  it('handles a single post', () => {
    const posts = [buildPost('only', '2024-01-01', 1)]
    expect(sortSeriesPosts(posts)).toHaveLength(1)
  })
})

// ─── getAdjacentSeriesPosts ───────────────────────────────────────────────────

describe('getAdjacentSeriesPosts', () => {
  const posts = [
    buildPost('first', '2024-03-01', 1),
    buildPost('second', '2024-03-02', 2),
    buildPost('third', '2024-03-03', 3)
  ]

  it('returns previous and next posts around a middle post', () => {
    expect(getAdjacentSeriesPosts(posts, 'second')).toEqual({
      currentIndex: 1,
      next: posts[2],
      previous: posts[0]
    })
  })

  it('returns no previous post for the first entry', () => {
    const result = getAdjacentSeriesPosts(posts, 'first')
    expect(result.previous).toBeUndefined()
    expect(result.next).toBe(posts[1])
    expect(result.currentIndex).toBe(0)
  })

  it('returns no next post for the last entry', () => {
    const result = getAdjacentSeriesPosts(posts, 'third')
    expect(result.next).toBeUndefined()
    expect(result.previous).toBe(posts[1])
    expect(result.currentIndex).toBe(2)
  })

  it('returns currentIndex -1 and no adjacents for an unknown post id', () => {
    const result = getAdjacentSeriesPosts(posts, 'not-in-list')
    expect(result.currentIndex).toBe(-1)
    expect(result.previous).toBeUndefined()
    expect(result.next).toBeUndefined()
  })

  it('returns no adjacents for a single-post list', () => {
    const single = [buildPost('only', '2024-01-01', 1)]
    const result = getAdjacentSeriesPosts(single, 'only')
    expect(result.previous).toBeUndefined()
    expect(result.next).toBeUndefined()
    expect(result.currentIndex).toBe(0)
  })
})
