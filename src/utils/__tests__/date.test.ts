import type { CollectionEntry } from 'astro:content'
import { describe, expect, it } from 'vitest'

import { collectionDateSortProjects, getFormattedDate } from '../date'

const expectDefined = <T>(value: T | undefined): T => {
  expect(value).toBeDefined()

  if (value === undefined) {
    throw new Error('Expected value to be defined')
  }

  return value
}

// ─── getFormattedDate ─────────────────────────────────────────────────────────

describe('getFormattedDate', () => {
  it('formats a Date object with the site locale', () => {
    // Use noon UTC to avoid any timezone boundary roll-over
    const date = new Date('2024-06-15T12:00:00Z')
    const result = getFormattedDate(date)
    expect(result).toContain('2024')
    expect(typeof result).toBe('string')
  })

  it('accepts a date string and formats it', () => {
    // ISO string with explicit time to avoid UTC-midnight timezone issues
    expect(getFormattedDate('2024-12-25T12:00:00')).toMatch(/25 Dec 2024|Dec 25, 2024/)
  })

  it('accepts a numeric timestamp and formats it', () => {
    const timestamp = new Date('2024-03-15T12:00:00.000Z').getTime()
    const result = getFormattedDate(timestamp)
    expect(result).toContain('2024')
  })

  it('returns "Invalid Date" when input is undefined', () => {
    expect(getFormattedDate(undefined)).toBe('Invalid Date')
  })

  it('returns "Invalid Date" for an invalid date string', () => {
    expect(getFormattedDate('invalid-date')).toBe('Invalid Date')
  })

  it('returns "Invalid Date" for an invalid Date object', () => {
    expect(getFormattedDate(new Date('invalid'))).toBe('Invalid Date')
  })

  it('respects custom month option passed as override', () => {
    const date = new Date('2024-01-15T12:00:00Z')
    const formatted = getFormattedDate(date, { month: 'long' })
    expect(formatted).toContain('January')
  })

  it('returns a consistent result across multiple calls with the same input', () => {
    const date = new Date('2022-09-10T12:00:00Z')
    expect(getFormattedDate(date)).toBe(getFormattedDate(date))
  })
})

// ─── collectionDateSortProjects ───────────────────────────────────────────────

const makeProject = (startingDate: Date) => ({ data: { startingDate } }) as unknown as CollectionEntry<'project'>

describe('collectionDateSortProjects', () => {
  it('returns a positive value when the first project is older', () => {
    const older = makeProject(new Date('2021-06-01'))
    const newer = makeProject(new Date('2024-06-01'))
    expect(collectionDateSortProjects(older, newer)).toBeGreaterThan(0)
  })

  it('returns a negative value when the first project is newer', () => {
    const older = makeProject(new Date('2021-06-01'))
    const newer = makeProject(new Date('2024-06-01'))
    expect(collectionDateSortProjects(newer, older)).toBeLessThan(0)
  })

  it('returns 0 for projects with the same start date', () => {
    const a = makeProject(new Date('2022-06-15'))
    const b = makeProject(new Date('2022-06-15'))
    expect(collectionDateSortProjects(a, b)).toBe(0)
  })

  it('sorts an array newest-first when used with Array.sort', () => {
    const projects = [
      makeProject(new Date('2020-06-01')),
      makeProject(new Date('2023-06-01')),
      makeProject(new Date('2021-06-01'))
    ]

    const sorted = [...projects].sort(collectionDateSortProjects)
    const [first, second, third] = sorted

    expect(expectDefined(first).data.startingDate.getFullYear()).toBe(2023)
    expect(expectDefined(second).data.startingDate.getFullYear()).toBe(2021)
    expect(expectDefined(third).data.startingDate.getFullYear()).toBe(2020)
  })
})
