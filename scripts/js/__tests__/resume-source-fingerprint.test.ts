// @vitest-environment node
import { afterEach, describe, expect, test, vi } from 'vitest'

import { getResumeSourceHash } from '../resume-source-fingerprint.mjs'

const hashAt = async (date: string) => {
  vi.setSystemTime(new Date(date))

  return getResumeSourceHash()
}

describe('resume source freshness', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('changes at a calendar-year rollover without source edits', async () => {
    vi.useFakeTimers()

    const previousYear = await hashAt('2026-12-31T12:00:00')
    const nextYear = await hashAt('2027-01-01T12:00:00')

    expect(nextYear).not.toBe(previousYear)
  })

  test('stays stable within the same render year', async () => {
    vi.useFakeTimers()

    const january = await hashAt('2026-01-01T12:00:00')
    const december = await hashAt('2026-12-31T12:00:00')

    expect(december).toBe(january)
  })
})
