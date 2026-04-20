import { describe, expect, it } from 'vitest'

import { dateMonthLong, dateWithoutDay } from '../date-format-presets'

describe('dateWithoutDay', () => {
  it('sets day to undefined', () => {
    expect(dateWithoutDay.day).toBeUndefined()
  })

  it('works as Intl.DateTimeFormatOptions with a real formatter', () => {
    const formatted = new Intl.DateTimeFormat('en-US', dateWithoutDay).format(new Date('2024-06-15'))
    expect(formatted).not.toContain('15')
  })
})

describe('dateMonthLong', () => {
  it('sets month to long', () => {
    expect(dateMonthLong.month).toBe('long')
  })

  it('produces a long month name when used in a formatter', () => {
    const formatted = new Intl.DateTimeFormat('en-US', dateMonthLong).format(new Date('2024-06-15'))
    expect(formatted).toContain('June')
  })
})
