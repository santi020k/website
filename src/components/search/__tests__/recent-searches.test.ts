import { describe, expect, test } from 'vitest'

import { getRecentSearches, rememberRecentSearch } from '../recent-searches'

const memoryStorage = (initial?: string) => {
  const values = new Map<string, string>(initial === undefined ? [] : [['site-search-recent', initial]])

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    values
  }
}

describe('recent searches', () => {
  test('puts the newest search first and keeps one spelling of each', () => {
    const storage = memoryStorage(JSON.stringify(['React', 'Astro']))

    rememberRecentSearch(' astro ', () => storage)

    expect(getRecentSearches(() => storage)).toEqual(['astro', 'React'])
  })

  test('ignores queries that are too short to search', () => {
    const storage = memoryStorage()

    rememberRecentSearch('a', () => storage)

    expect(storage.values.size).toBe(0)
  })

  test('treats corrupt or blocked storage as empty', () => {
    expect(getRecentSearches(() => memoryStorage('{not json'))).toEqual([])
    expect(getRecentSearches(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })).toEqual([])
    expect(() => {
      rememberRecentSearch('Astro', () => {
        throw new DOMException('Blocked', 'SecurityError')
      })
    }).not.toThrow()
  })
})
