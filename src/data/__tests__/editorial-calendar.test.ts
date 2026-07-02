import { describe, expect, test } from 'vitest'

import { editorialCalendar, publishingRhythm } from '../editorial-calendar'

describe('publishingRhythm', () => {
  test('has a non-empty summary', () => {
    expect(publishingRhythm.summary).toBeTruthy()
  })

  test('has an updatedOn date string', () => {
    expect(publishingRhythm.updatedOn).toBeTruthy()
  })
})

describe('editorialCalendar', () => {
  test('is a non-empty array', () => {
    expect(editorialCalendar.length).toBeGreaterThan(0)
  })

  test('every entry has required fields', () => {
    for (const entry of editorialCalendar) {
      expect(entry.format, `${entry.month} missing format`).toBeTruthy()
      expect(entry.headline, `${entry.month} missing headline`).toBeTruthy()
      expect(entry.month, 'month must be truthy').toBeTruthy()
      expect(entry.refreshTitle, `${entry.month} missing refreshTitle`).toBeTruthy()
      expect(entry.searchIntent, `${entry.month} missing searchIntent`).toBeTruthy()
    }
  })

  test('seriesId is a string when present', () => {
    const withSeries = editorialCalendar.filter(e => e.seriesId !== undefined)
    expect(withSeries.length).toBeGreaterThan(0)
    for (const entry of withSeries) {
      expect(typeof entry.seriesId).toBe('string')
    }
  })
})
