import { describe, expect, it } from 'vitest'

import {
  getProjectDateRangeLabel,
  getProjectDurationLabel,
  getProjectFocusLabel,
  getProjectScopeHighlights,
  getProjectTimelineLabel,
  getProjectTypeLabel
} from '../project-meta'

// ─── getProjectTypeLabel ──────────────────────────────────────────────────────

describe('getProjectTypeLabel', () => {
  it('returns "Personal project" for personal type', () => {
    expect(getProjectTypeLabel('personal')).toBe('Personal project')
  })

  it('returns "Experimental work" for experimental type', () => {
    expect(getProjectTypeLabel('experimental')).toBe('Experimental work')
  })

  it('returns "Professional work" for professional type', () => {
    expect(getProjectTypeLabel('professional')).toBe('Professional work')
  })

  it('returns "Professional work" for undefined type', () => {
    expect(getProjectTypeLabel(undefined)).toBe('Professional work')
  })
})

// ─── getProjectFocusLabel ─────────────────────────────────────────────────────

describe('getProjectFocusLabel', () => {
  it('returns the personal focus label', () => {
    expect(getProjectFocusLabel('personal')).toContain('Open source')
  })

  it('returns the experimental focus label', () => {
    expect(getProjectFocusLabel('experimental')).toContain('Experiments')
  })

  it('returns the professional focus label for undefined', () => {
    expect(getProjectFocusLabel(undefined)).toContain('Architecture')
  })
})

// ─── getProjectScopeHighlights ────────────────────────────────────────────────

describe('getProjectScopeHighlights', () => {
  it('returns an array of 3 strings for personal', () => {
    const result = getProjectScopeHighlights('personal')
    expect(result).toHaveLength(3)
    expect(result.every(s => typeof s === 'string')).toBe(true)
  })

  it('returns an array of 3 strings for experimental', () => {
    const result = getProjectScopeHighlights('experimental')
    expect(result).toHaveLength(3)
  })

  it('returns an array of 3 strings for professional (undefined)', () => {
    const result = getProjectScopeHighlights(undefined)
    expect(result).toHaveLength(3)
  })

  it('personal highlights mention knowledge sharing', () => {
    const highlights = getProjectScopeHighlights('personal')
    expect(highlights.join(' ').toLowerCase()).toContain('knowledge')
  })
})

// ─── getProjectTimelineLabel ──────────────────────────────────────────────────

describe('getProjectTimelineLabel', () => {
  it('shows "Present" when no end date is given', () => {
    const start = new Date('2022-01-01')
    expect(getProjectTimelineLabel(start)).toContain('Present')
  })

  it('includes both start and end dates when provided', () => {
    const start = new Date('2021-06-15T12:00:00Z')
    const end = new Date('2023-09-15T12:00:00Z')
    const label = getProjectTimelineLabel(start, end)
    expect(label).toContain('2021')
    expect(label).toContain('2023')
    expect(label).toContain(' - ')
  })
})

// ─── getProjectDateRangeLabel ─────────────────────────────────────────────────

describe('getProjectDateRangeLabel', () => {
  it('returns only the start year when no end date is given', () => {
    // Use mid-year dates to avoid UTC midnight rolling into the prior day in negative-offset timezones
    expect(getProjectDateRangeLabel(new Date('2021-06-15'))).toBe('2021')
  })

  it('returns only the start year when start and end are the same year', () => {
    expect(getProjectDateRangeLabel(new Date('2021-03-15'), new Date('2021-09-15'))).toBe('2021')
  })

  it('returns a year range when start and end differ', () => {
    expect(getProjectDateRangeLabel(new Date('2020-06-15'), new Date('2023-06-15'))).toBe('2020 - 2023')
  })
})

// ─── getProjectDurationLabel ──────────────────────────────────────────────────

describe('getProjectDurationLabel', () => {
  it('returns duration in months when less than 12 months', () => {
    const start = new Date('2023-01-01')
    const end = new Date('2023-06-01')
    const label = getProjectDurationLabel(start, end)
    expect(label).toMatch(/\d+ mo/)
  })

  it('returns duration in years when exactly 12 months', () => {
    // getMonthDifference adds +1 when endDate.getDate() >= startDate.getDate(),
    // so to land on exactly 12 the end day must be strictly before the start day.
    const start = new Date('2022-06-15T12:00:00Z')
    const end = new Date('2023-06-14T12:00:00Z')
    const label = getProjectDurationLabel(start, end)
    expect(label).toBe('1 yr')
  })

  it('returns duration in years and months when not evenly divisible', () => {
    const start = new Date('2021-06-15T12:00:00Z')
    const end = new Date('2022-08-15T12:00:00Z')
    const label = getProjectDurationLabel(start, end)
    expect(label).toContain('yr')
    expect(label).toContain('mo')
  })

  it('returns "yr" (not "yrs") for exactly 1 year', () => {
    const start = new Date('2022-06-15T12:00:00Z')
    const end = new Date('2023-06-15T12:00:00Z')
    expect(getProjectDurationLabel(start, end)).toContain('1 yr')
    expect(getProjectDurationLabel(start, end)).not.toContain('1 yrs')
  })

  it('returns "yrs" for more than 1 year with no leftover months', () => {
    // End day must be strictly before start day so getMonthDifference doesn't add +1
    const start = new Date('2020-06-15T12:00:00Z')
    const end = new Date('2023-06-14T12:00:00Z')
    expect(getProjectDurationLabel(start, end)).toBe('3 yrs')
  })

  it('uses the current date when no end date is provided (minimum 1 mo)', () => {
    // Started just now — should return at least "1 mo"
    const start = new Date()
    const label = getProjectDurationLabel(start)
    expect(label).toMatch(/mo|yr/)
  })
})
