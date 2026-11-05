// @vitest-environment node
import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { parseContentDate } from '../content-date'

const toIsoOrNull = (date: Date) => (Number.isNaN(date.getTime()) ? null : date.toISOString())

// Authored inputs and the instant every runtime timezone must produce for them.
const contract = [
  { input: '2026-09-04', expected: '2026-09-04T00:00:00.000Z' },
  { input: '4 Sep 2026', expected: '2026-09-04T00:00:00.000Z' },
  { input: '01 jan 2020', expected: '2020-01-01T00:00:00.000Z' },
  { input: '2026-06-22T00:00:00.000Z', expected: '2026-06-22T00:00:00.000Z' },
  { input: '2024-12-25T12:00:00', expected: '2024-12-25T12:00:00.000Z' },
  { input: '2026-09-04T23:30:00-05:00', expected: '2026-09-05T04:30:00.000Z' },
  { input: '2026-09-04T08:00:00+09:00', expected: '2026-09-03T23:00:00.000Z' },
  { input: '2026-09-04T23:30:00-0500', expected: '2026-09-05T04:30:00.000Z' },
  { input: '2026-09-04T08:00:00+0900', expected: '2026-09-03T23:00:00.000Z' },
  { input: '2024-02-29', expected: '2024-02-29T00:00:00.000Z' },
  { input: '2000-02-29', expected: '2000-02-29T00:00:00.000Z' },
  { input: '2026-02-29', expected: null },
  { input: '1900-02-29', expected: null },
  { input: '31 Apr 2026', expected: null },
  { input: '2026-02-30T12:00:00Z', expected: null }
]

describe('parseContentDate', () => {
  test.each(contract)('parses $input as $expected', ({ input, expected }) => {
    expect(toIsoOrNull(parseContentDate(input))).toBe(expected)
  })

  test('returns Date values unchanged', () => {
    const date = new Date('2026-01-15T12:34:56.789Z')

    expect(parseContentDate(date)).toBe(date)
  })

  test.each([
    '',
    'not a date',
    'September 4, 2026',
    '2026-9-4',
    '4 Sept 2026',
    '2026-01-15T25:00:00Z'
  ])('rejects the unsupported date string %j', input => {
    expect(Number.isNaN(parseContentDate(input).getTime())).toBe(true)
  })
})

describe('parseContentDate across runtime timezones', () => {
  const helperUrl = new URL('../content-date.ts', import.meta.url).href

  // Fresh processes apply each timezone before module loading, independently of Vitest workers.
  const script = `
    const { parseContentDate } = await import(process.env.CONTENT_DATE_HELPER)
    const inputs = JSON.parse(process.env.CONTENT_DATE_INPUTS)

    console.log(JSON.stringify({
      offset: new Date(2026, 0, 1).getTimezoneOffset(),
      results: inputs.map(input => {
        const date = parseContentDate(input)

        return Number.isNaN(date.getTime()) ? null : date.toISOString()
      })
    }))
  `

  test.each([
    { timeZone: 'UTC', offset: 0 },
    { timeZone: 'Asia/Tokyo', offset: -540 },
    { timeZone: 'America/Bogota', offset: 300 }
  ])('produces the same instants in $timeZone', ({ timeZone, offset }) => {
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        CONTENT_DATE_HELPER: helperUrl,
        CONTENT_DATE_INPUTS: JSON.stringify(contract.map(({ input }) => input)),
        TZ: timeZone
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const output: unknown = JSON.parse(stdout)

    // The offset proves the child process really ran in the requested zone.
    expect(output).toEqual({ offset, results: contract.map(({ expected }) => expected) })
  })
})
