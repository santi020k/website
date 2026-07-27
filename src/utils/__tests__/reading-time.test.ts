import { describe, expect, test } from 'vitest'

import { getReadingTime } from '../reading-time'

describe('getReadingTime', () => {
  test('returns 1 for undefined input', () => {
    expect(getReadingTime(undefined)).toBe(1)
  })

  test('returns 1 for an empty string', () => {
    expect(getReadingTime('')).toBe(1)
  })

  test('returns 1 for a whitespace-only string', () => {
    expect(getReadingTime('   ')).toBe(1)
  })

  test('returns 1 for fewer than 200 words', () => {
    const body = 'word '.repeat(100).trim()
    expect(getReadingTime(body)).toBe(1)
  })

  test('returns 1 for exactly 200 words', () => {
    const body = 'word '.repeat(200).trim()
    expect(getReadingTime(body)).toBe(1)
  })

  test('returns 2 for 201 words', () => {
    const body = 'word '.repeat(201).trim()
    expect(getReadingTime(body)).toBe(2)
  })

  test('returns 5 for 1000 words', () => {
    const body = 'word '.repeat(1000).trim()
    expect(getReadingTime(body)).toBe(5)
  })

  test('handles multi-whitespace separators correctly', () => {
    const body = 'one  two\tthree\nfour'
    expect(getReadingTime(body)).toBe(1)
  })
})
