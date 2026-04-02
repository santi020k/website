import type { CollectionEntry } from 'astro:content'
import { describe, expect, it } from 'vitest'

import { collectionDateSort, collectionDateSortProjects, getFormattedDate } from '../date'

describe('getFormattedDate', () => {
  it('should format a Date object correctly', () => {
    const date = new Date('2024-01-01T12:00:00Z')
    expect(getFormattedDate(date)).toMatch(/1 Jan 2024|Jan 1, 2024/)
  })

  it('should format a string date correctly', () => {
    expect(getFormattedDate('2024-12-25T12:00:00')).toMatch(/25 Dec 2024|Dec 25, 2024/)
  })

  it('should return "Invalid Date" for undefined input', () => {
    expect(getFormattedDate(undefined)).toBe('Invalid Date')
  })

  it('should return "Invalid Date" for invalid string input', () => {
    expect(getFormattedDate('invalid-date')).toBe('Invalid Date')
  })

  it('should accept custom options', () => {
    const date = new Date('2024-01-01T12:00:00')
    const formatted = getFormattedDate(date, { month: 'long' })
    expect(formatted).toContain('January')
  })
})

describe('collectionDateSort', () => {
  it('should sort entries by publishDate descending', () => {
    const a = { data: { publishDate: new Date('2024-01-01') } } as unknown as CollectionEntry<'post'>
    const b = { data: { publishDate: new Date('2024-02-01') } } as unknown as CollectionEntry<'post'>
    expect(collectionDateSort(a, b)).toBeGreaterThan(0)
    expect(collectionDateSort(b, a)).toBeLessThan(0)
  })
})

describe('collectionDateSortProjects', () => {
  it('should sort projects by startingDate descending', () => {
    const a = { data: { startingDate: new Date('2024-01-01') } } as unknown as CollectionEntry<'project'>
    const b = { data: { startingDate: new Date('2024-02-01') } } as unknown as CollectionEntry<'project'>
    expect(collectionDateSortProjects(a, b)).toBeGreaterThan(0)
    expect(collectionDateSortProjects(b, a)).toBeLessThan(0)
  })
})
