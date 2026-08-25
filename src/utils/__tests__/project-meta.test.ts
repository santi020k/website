import { describe, expect, test } from 'vitest'

import {
  getProjectDateRangeLabel,
  getProjectDurationLabel,
  getProjectFeaturedLabel,
  getProjectFocusLabel,
  getProjectNotesLabel,
  getProjectRelatedHeading,
  getProjectScopeHighlights,
  getProjectStageLabel,
  getProjectStatusLabel,
  getProjectTimelineLabel,
  getProjectTypeLabel
} from '../project-meta'

// ─── getProjectTypeLabel ──────────────────────────────────────────────────────

describe('getProjectTypeLabel', () => {
  test('returns "Personal project" for personal type', () => {
    expect(getProjectTypeLabel('personal')).toBe('Personal project')
  })

  test('returns "Experimental work" for experimental type', () => {
    expect(getProjectTypeLabel('experimental')).toBe('Experimental work')
  })

  test('returns "Professional work" for professional type', () => {
    expect(getProjectTypeLabel('professional')).toBe('Professional work')
  })

  test('returns "Professional work" for undefined type', () => {
    expect(getProjectTypeLabel(undefined)).toBe('Professional work')
  })
})

// ─── getProjectStageLabel ─────────────────────────────────────────────────────

describe('getProjectStageLabel', () => {
  test('returns a draft label before active or completed state', () => {
    expect(getProjectStageLabel('personal', undefined, true)).toBe('Draft personal project')
    expect(getProjectStageLabel('experimental', new Date(), true)).toBe('Draft experimental work')
  })

  test('returns "Completed project" for personal with end date', () => {
    expect(getProjectStageLabel('personal', new Date())).toBe('Completed project')
  })

  test('returns "Active project" for personal without end date', () => {
    expect(getProjectStageLabel('personal')).toBe('Active project')
  })

  test('returns "Completed experiment" for experimental with end date', () => {
    expect(getProjectStageLabel('experimental', new Date())).toBe('Completed experiment')
  })

  test('returns "Active experiment" for experimental without end date', () => {
    expect(getProjectStageLabel('experimental')).toBe('Active experiment')
  })

  test('returns "Completed work" for professional with end date', () => {
    expect(getProjectStageLabel('professional', new Date())).toBe('Completed work')
  })

  test('returns "Active work" for professional without end date', () => {
    expect(getProjectStageLabel('professional')).toBe('Active work')
  })

  test('returns "Active work" for undefined without end date', () => {
    expect(getProjectStageLabel(undefined)).toBe('Active work')
  })
})

describe('getProjectStatusLabel', () => {
  test('returns Draft for draft projects regardless of their timeline', () => {
    expect(getProjectStatusLabel(true)).toBe('Draft')
    expect(getProjectStatusLabel(true, new Date())).toBe('Draft')
  })

  test('returns Active or Completed for published projects', () => {
    expect(getProjectStatusLabel(false)).toBe('Active')
    expect(getProjectStatusLabel(false, new Date())).toBe('Completed')
  })
})

// ─── getProjectFeaturedLabel ──────────────────────────────────────────────────

describe('getProjectFeaturedLabel', () => {
  test('returns "Personal project" for personal', () => {
    expect(getProjectFeaturedLabel('personal')).toBe('Personal project')
  })

  test('returns "Featured experiment" for experimental', () => {
    expect(getProjectFeaturedLabel('experimental')).toBe('Featured experiment')
  })

  test('returns "Featured work" for professional', () => {
    expect(getProjectFeaturedLabel('professional')).toBe('Featured work')
  })

  test('returns "Featured work" for undefined', () => {
    expect(getProjectFeaturedLabel(undefined)).toBe('Featured work')
  })
})

// ─── getProjectNotesLabel ─────────────────────────────────────────────────────

describe('getProjectNotesLabel', () => {
  test('returns "Project notes" for personal', () => {
    expect(getProjectNotesLabel('personal')).toBe('Project notes')
  })

  test('returns "Experiment notes" for experimental', () => {
    expect(getProjectNotesLabel('experimental')).toBe('Experiment notes')
  })

  test('returns "Work notes" for professional', () => {
    expect(getProjectNotesLabel('professional')).toBe('Work notes')
  })

  test('returns "Work notes" for undefined', () => {
    expect(getProjectNotesLabel(undefined)).toBe('Work notes')
  })
})

// ─── getProjectRelatedHeading ─────────────────────────────────────────────────

describe('getProjectRelatedHeading', () => {
  test('returns personal heading for personal', () => {
    expect(getProjectRelatedHeading('personal')).toBe('More projects in a similar lane.')
  })

  test('returns experiment heading for experimental', () => {
    expect(getProjectRelatedHeading('experimental')).toBe('More experiments in a similar lane.')
  })

  test('returns work heading for professional', () => {
    expect(getProjectRelatedHeading('professional')).toBe('More work in a similar lane.')
  })

  test('returns work heading for undefined', () => {
    expect(getProjectRelatedHeading(undefined)).toBe('More work in a similar lane.')
  })
})

// ─── getProjectFocusLabel ─────────────────────────────────────────────────────

describe('getProjectFocusLabel', () => {
  test('returns the personal focus label', () => {
    expect(getProjectFocusLabel('personal')).toContain('Open source')
  })

  test('returns the experimental focus label', () => {
    expect(getProjectFocusLabel('experimental')).toContain('Experiments')
  })

  test('returns the professional focus label for undefined', () => {
    expect(getProjectFocusLabel(undefined)).toContain('Architecture')
  })
})

// ─── getProjectScopeHighlights ────────────────────────────────────────────────

describe('getProjectScopeHighlights', () => {
  test('returns an array of 3 strings for personal', () => {
    const result = getProjectScopeHighlights('personal')
    expect(result).toHaveLength(3)
    expect(result.every(s => typeof s === 'string')).toBe(true)
  })

  test('returns an array of 3 strings for experimental', () => {
    const result = getProjectScopeHighlights('experimental')
    expect(result).toHaveLength(3)
  })

  test('returns an array of 3 strings for professional (undefined)', () => {
    const result = getProjectScopeHighlights(undefined)
    expect(result).toHaveLength(3)
  })

  test('personal highlights mention knowledge sharing', () => {
    const highlights = getProjectScopeHighlights('personal')
    expect(highlights.join(' ').toLowerCase()).toContain('knowledge')
  })
})

// ─── getProjectTimelineLabel ──────────────────────────────────────────────────

describe('getProjectTimelineLabel', () => {
  test('shows "Present" when no end date is given', () => {
    const start = new Date('2022-01-01')
    expect(getProjectTimelineLabel(start)).toContain('Present')
  })

  test('includes both start and end dates when provided', () => {
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
  test('returns only the start year when no end date is given', () => {
    // Use mid-year dates to avoid UTC midnight rolling into the prior day in negative-offset timezones
    expect(getProjectDateRangeLabel(new Date('2021-06-15'))).toBe('2021')
  })

  test('returns only the start year when start and end are the same year', () => {
    expect(getProjectDateRangeLabel(new Date('2021-03-15'), new Date('2021-09-15'))).toBe('2021')
  })

  test('returns a year range when start and end differ', () => {
    expect(getProjectDateRangeLabel(new Date('2020-06-15'), new Date('2023-06-15'))).toBe('2020 - 2023')
  })
})

// ─── getProjectDurationLabel ──────────────────────────────────────────────────

describe('getProjectDurationLabel', () => {
  test('returns duration in months when less than 12 months', () => {
    const start = new Date('2023-01-01')
    const end = new Date('2023-06-01')
    const label = getProjectDurationLabel(start, end)
    expect(label).toMatch(/\d+ mo/)
  })

  test('returns duration in years when exactly 12 months', () => {
    // getMonthDifference adds +1 when endDate.getDate() >= startDate.getDate(),
    // so to land on exactly 12 the end day must be strictly before the start day.
    const start = new Date('2022-06-15T12:00:00Z')
    const end = new Date('2023-06-14T12:00:00Z')
    const label = getProjectDurationLabel(start, end)
    expect(label).toBe('1 yr')
  })

  test('returns duration in years and months when not evenly divisible', () => {
    const start = new Date('2021-06-15T12:00:00Z')
    const end = new Date('2022-08-15T12:00:00Z')
    const label = getProjectDurationLabel(start, end)
    expect(label).toContain('yr')
    expect(label).toContain('mo')
  })

  test('returns "yr" (not "yrs") for exactly 1 year', () => {
    const start = new Date('2022-06-15T12:00:00Z')
    const end = new Date('2023-06-15T12:00:00Z')
    expect(getProjectDurationLabel(start, end)).toContain('1 yr')
    expect(getProjectDurationLabel(start, end)).not.toContain('1 yrs')
  })

  test('returns "yrs" for more than 1 year with no leftover months', () => {
    // End day must be strictly before start day so getMonthDifference doesn't add +1
    const start = new Date('2020-06-15T12:00:00Z')
    const end = new Date('2023-06-14T12:00:00Z')
    expect(getProjectDurationLabel(start, end)).toBe('3 yrs')
  })

  test('uses the current date when no end date is provided (minimum 1 mo)', () => {
    // Started just now — should return at least "1 mo"
    const start = new Date()
    const label = getProjectDurationLabel(start)
    expect(label).toMatch(/mo|yr/)
  })
})
