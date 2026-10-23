// cspell:words cancion canción cuna diseno diseño किताब कताब كَتَبَ كتب
import type { SearchIndexEntry } from '@/types/search'
import { getPopularTopics, isSearchableQuery, isSearchEntry, rankSearchEntry } from '@/utils/search'

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
      coverAvifUrl: '/_astro/cover.avif',
      coverUrl: '/_astro/cover.webp'
    }, origin)).toBe(true)
  })

  test.each([
    null,
    [],
    {},
    { ...entry, title: ' ' },
    { ...entry, description: null },
    { ...entry, tags: ['Astro', 1] },
    { ...entry, type: 'unknown' }
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

  test('folds Latin accents and case across title, tags, and description', () => {
    const accented: SearchIndexEntry = {
      ...entry,
      description: 'How waiting for Aarón became a calm timer.',
      tags: ['Diseño'],
      title: 'Canción de cuna'
    }

    for (const query of ['aaron', 'AARON', 'Aarón', 'aarón'.normalize('NFD')]) {
      expect(rankSearchEntry(accented, query)).toBeGreaterThan(0)
    }

    expect(rankSearchEntry(accented, 'cancion')).toBe(rankSearchEntry(accented, 'Canción'))
    expect(rankSearchEntry(accented, 'diseno')).toBe(rankSearchEntry(accented, 'DISEÑO'.normalize('NFD')))
    expect(rankSearchEntry({ ...accented, title: 'Canción de cuna'.normalize('NFD') }, 'canción')).toBe(rankSearchEntry(accented, 'canción'))
  })

  test('keeps ranking and all-word matching with accent-insensitive queries', () => {
    const accented: SearchIndexEntry = { ...entry, description: 'Waiting for Aarón.', tags: [], title: 'Between Contractions' }

    expect(rankSearchEntry(accented, 'between aaron')).toBeGreaterThan(rankSearchEntry(accented, 'aaron'))
    expect(rankSearchEntry(accented, 'aaron missing')).toBe(0)
    expect(rankSearchEntry({ ...accented, title: 'Aarón' }, 'aaron')).toBeGreaterThan(rankSearchEntry(accented, 'aaron'))
  })

  test('keeps non-Latin combining marks significant', () => {
    const devanagari: SearchIndexEntry = { ...entry, description: '', tags: [], title: 'किताब' }
    const arabic: SearchIndexEntry = { ...entry, description: '', tags: [], title: 'كَتَبَ' }

    expect(rankSearchEntry(devanagari, 'किताब')).toBeGreaterThan(0)
    expect(rankSearchEntry(devanagari, 'कताब')).toBe(0)
    expect(rankSearchEntry(arabic, 'كَتَبَ')).toBeGreaterThan(0)
    expect(rankSearchEntry({ ...arabic, title: 'كتب' }, 'كَتَبَ')).toBe(0)
  })

  test.each(['', '   ', '\u0301', '\u0301\u0303', ' \u0300 '])('does not match everything for empty query %j', query => {
    expect(rankSearchEntry(entry, query)).toBe(0)
  })

  test.each(['é', 'é'.normalize('NFD'), 'É'.normalize('NFD'), ' é ', '́', '́̃', 'á́', ''])(
    'holds one-letter and mark-only query %j below the two-character minimum', query => {
      expect(isSearchableQuery(query)).toBe(false)
    }
  )

  test.each(['éa', 'éa'.normalize('NFD'), 'ab', ' ab ', 'कि'])('accepts two-character query %j', query => {
    expect(isSearchableQuery(query)).toBe(true)
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
