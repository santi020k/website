import { describe, expect, test } from 'vitest'

import { getAdjacentSeriesPosts, getSeriesFocusAreas, sortSeriesPosts } from '../series'

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

describe('getSeriesFocusAreas', () => {
  const now = new Date('2026-10-28T12:00:00Z')
  const published = (tags: string[]) => ({ data: { publishDate: new Date('2026-10-01'), tags } })

  test('preserves authored labels and order while matching real archive display names', () => {
    expect(getSeriesFocusAreas(['Next.js', 'CI-CD', 'Developer Experience', 'Delivery Systems'], [
      published(['nextjs', 'ci-cd', 'developer-experience'])
    ], now)).toEqual([
      { label: 'Next.js', tag: 'nextjs' },
      { label: 'CI-CD', tag: 'ci-cd' },
      { label: 'Developer Experience', tag: 'developer-experience' },
      { label: 'Delivery Systems', tag: undefined }
    ])
  })

  test('does not link to draft-only, future-only, or absent topic archives', () => {
    const posts = [
      { data: { draft: true, publishDate: new Date('2026-10-01'), tags: ['testing'] } },
      { data: { publishDate: new Date('2026-10-29'), tags: ['typescript'] } }
    ]

    expect(getSeriesFocusAreas(['Testing', 'TypeScript', 'Architecture'], posts, now)
      .every(area => area.tag === undefined)).toBe(true)
  })

  test('deduplicates repeated tags and allows a topic with at least one published article', () => {
    expect(getSeriesFocusAreas(['Testing'], [
      published(['testing', 'testing']),
      published(['testing']),
      { data: { draft: true, publishDate: now, tags: ['testing'] } }
    ], now)).toEqual([{ label: 'Testing', tag: 'testing' }])
  })

  test('leaves ambiguous normalized topic names plain instead of choosing arbitrarily', () => {
    expect(getSeriesFocusAreas(['Next.js'], [published(['nextjs', 'next-js'])], now))
      .toEqual([{ label: 'Next.js', tag: undefined }])
  })

  test('does not confuse language names with significant plus and hash punctuation', () => {
    expect(getSeriesFocusAreas(['C', 'C++', 'C#'], [published(['c'])], now)).toEqual([
      { label: 'C', tag: 'c' }, { label: 'C++', tag: undefined }, { label: 'C#', tag: undefined }
    ])
  })

  test('handles empty collections and leaves its inputs unchanged', () => {
    const areas = [' Testing ', 'NEXT.JS']
    const posts = [published(['nextjs', 'testing'])]
    const original = structuredClone({ areas, posts })

    expect(getSeriesFocusAreas(areas, posts, now).map(area => area.tag)).toEqual(['testing', 'nextjs'])
    expect({ areas, posts }).toEqual(original)
    expect(getSeriesFocusAreas([], posts, now)).toEqual([])
    expect(getSeriesFocusAreas(['Testing'], [], now)).toEqual([{ label: 'Testing', tag: undefined }])
  })
})

// ─── sortSeriesPosts ──────────────────────────────────────────────────────────

describe('sortSeriesPosts', () => {
  test('sorts by explicit series order before publish date', () => {
    const posts = [
      buildPost('third', '2024-03-03', 3),
      buildPost('first', '2024-03-01', 1),
      buildPost('second', '2024-03-02', 2)
    ]

    expect(sortSeriesPosts(posts).map(post => post.id)).toEqual(['first', 'second', 'third'])
  })

  test('falls back to publish date when no order is present', () => {
    const posts = [
      buildPost('later', '2024-04-18'),
      buildPost('earlier', '2024-03-21')
    ]

    expect(sortSeriesPosts(posts).map(post => post.id)).toEqual(['earlier', 'later'])
  })

  test('places ordered posts before unordered ones', () => {
    const posts = [
      buildPost('unordered', '2024-01-01'),
      buildPost('ordered', '2024-01-02', 1)
    ]

    expect(expectDefined(sortSeriesPosts(posts)[0]).id).toBe('ordered')
  })

  test('does not mutate the original array', () => {
    const posts = [
      buildPost('b', '2024-02-01', 2),
      buildPost('a', '2024-01-01', 1)
    ]
    const original = [...posts]
    sortSeriesPosts(posts)
    expect(posts).toEqual(original)
  })

  test('handles an empty array', () => {
    expect(sortSeriesPosts([])).toEqual([])
  })

  test('handles a single post', () => {
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

  test('returns previous and next posts around a middle post', () => {
    expect(getAdjacentSeriesPosts(posts, 'second')).toEqual({
      currentIndex: 1,
      next: posts[2],
      previous: posts[0]
    })
  })

  test('returns no previous post for the first entry', () => {
    const result = getAdjacentSeriesPosts(posts, 'first')
    expect(result.previous).toBeUndefined()
    expect(result.next).toBe(posts[1])
    expect(result.currentIndex).toBe(0)
  })

  test('returns no next post for the last entry', () => {
    const result = getAdjacentSeriesPosts(posts, 'third')
    expect(result.next).toBeUndefined()
    expect(result.previous).toBe(posts[1])
    expect(result.currentIndex).toBe(2)
  })

  test('returns currentIndex -1 and no adjacents for an unknown post id', () => {
    const result = getAdjacentSeriesPosts(posts, 'not-in-list')
    expect(result.currentIndex).toBe(-1)
    expect(result.previous).toBeUndefined()
    expect(result.next).toBeUndefined()
  })

  test('returns no adjacents for a single-post list', () => {
    const single = [buildPost('only', '2024-01-01', 1)]
    const result = getAdjacentSeriesPosts(single, 'only')
    expect(result.previous).toBeUndefined()
    expect(result.next).toBeUndefined()
    expect(result.currentIndex).toBe(0)
  })
})
