import type { SearchIndexEntry } from '@/types/search'
import { getPopularTopics, isSearchEntry, rankSearchEntry } from '@/utils/search'

import { describe, expect, test } from 'vitest'

const origin = 'https://santi020k.com'

const entry: SearchIndexEntry = {
  description: 'Build accessible interfaces.',
  path: '/blog/astro-guide/',
  tags: ['TypeScript', 'Astro'],
  title: 'Astro guide',
  type: 'post'
}

describe('search index validation', () => {
  test('accepts a local entry with optional responsive artwork', () => {
    expect(isSearchEntry(entry, origin)).toBe(true)
    expect(isSearchEntry({
      ...entry,
      coverAlt: 'Article artwork',
      coverAvifUrl: '/_astro/cover.avif',
      coverUrl: '/_astro/cover.webp',
      coverWidth: 200,
      coverHeight: 125
    }, origin)).toBe(true)
  })

  test.each([
    null,
    [],
    {},
    { ...entry, title: ' ' },
    { ...entry, description: null },
    { ...entry, tags: ['Astro', 1] },
    { ...entry, type: 'unknown' },
    { ...entry, coverWidth: 0 },
    { ...entry, coverHeight: 1.5 },
    { ...entry, coverAlt: false }
  ])('rejects malformed entry %j', value => {
    expect(isSearchEntry(value, origin)).toBe(false)
  })

  test.each(['https://example.com/', '//example.com/', '/\\example.com/', 'javascript:alert(1)']) (
    'rejects nonlocal destinations and image URLs: %s', path => {
      for (const field of ['path', 'coverUrl', 'coverAvifUrl']) {
        expect(isSearchEntry({ ...entry, [field]: path }, origin)).toBe(false)
      }
    }
  )
})

describe('search relevance', () => {
  test('prefers an exact title to tags or descriptions', () => {
    const exactTitle = rankSearchEntry(entry, 'astro guide')
    const tag = rankSearchEntry({ ...entry, title: 'Notes', tags: ['Astro guide'] }, 'astro guide')
    const description = rankSearchEntry({ ...entry, title: 'Notes', tags: [], description: 'An Astro guide.' }, 'astro guide')

    expect(exactTitle).toBeGreaterThan(tag)
    expect(tag).toBeGreaterThan(description)
  })

  test('requires every query word while allowing matches across fields', () => {
    expect(rankSearchEntry(entry, 'astro interfaces')).toBeGreaterThan(0)
    expect(rankSearchEntry(entry, 'astro missing')).toBe(0)
    expect(rankSearchEntry(entry, 'typescript')).toBeGreaterThan(0)
  })

  test('merges topic casing and limits the most frequent suggestions', () => {
    const topics = getPopularTopics([
      { ...entry, tags: ['typescript', 'Astro'] },
      { ...entry, tags: ['TypeScript'] },
      ...Array.from({ length: 10 }, (_, index) => ({ ...entry, tags: [`Topic ${index}`] }))
    ])

    expect(topics).toHaveLength(8)
    expect(topics[0]).toBe('TypeScript')
    expect(topics).not.toContain('typescript')
    expect(getPopularTopics([])).toEqual([])
  })
})
