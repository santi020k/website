import { describe, expect, it } from 'vitest'

import { getFormattedDate } from '../date'

describe('getFormattedDate', () => {
  it('should format a Date object correctly', () => {
    const date = new Date('2024-01-01T12:00:00Z')
    // siteConfig.date.locale is likely 'en-GB' or similar based on project structure
    expect(getFormattedDate(date)).toMatch(/1 Jan 2024|Jan 1, 2024/)
  })

  it('should format a string date correctly', () => {
    // Add time component to prevent UTC-to-local day shifting
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
