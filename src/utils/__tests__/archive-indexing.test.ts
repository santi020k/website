import { describe, expect, test } from 'vitest'

import { isIndexedArchive, MIN_INDEXED_ARCHIVE_ENTRIES } from '../archive-indexing'

describe('archive indexing threshold', () => {
  test('indexes archives with at least three entries', () => {
    expect(MIN_INDEXED_ARCHIVE_ENTRIES).toBe(3)
    expect(isIndexedArchive(3)).toBe(true)
    expect(isIndexedArchive(42)).toBe(true)
  })

  test('keeps thinner archives out of search indexes', () => {
    expect(isIndexedArchive(0)).toBe(false)
    expect(isIndexedArchive(1)).toBe(false)
    expect(isIndexedArchive(2)).toBe(false)
  })
})
