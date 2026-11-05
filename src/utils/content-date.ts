/**
 * Parses authored content dates into the same instant in every runtime timezone.
 *
 * Supported frontmatter strings:
 * - `YYYY-MM-DD` and `D Mon YYYY` (for example `2026-09-04` or `4 Sep 2026`) are calendar dates at
 *   UTC midnight.
 * - ISO timestamps with `Z`, `±HH:MM`, or `±HHMM` offsets keep their exact instant.
 * - ISO timestamps without a zone are read as UTC.
 *
 * `Date` values (unquoted YAML dates) are returned unchanged. Unsupported strings and calendar
 * dates that do not exist, such as `2026-02-29`, become Invalid Date so schemas can reject them.
 */

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/u
const dayMonthYearPattern = /^(\d{1,2}) ([a-z]{3}) (\d{4})$/iu
const timestampPattern = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(Z|[+-]\d{2}:?\d{2})?$/u
const monthAbbreviations = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** Builds UTC midnight for a calendar date, or `undefined` when the day would roll over. */
const toUtcCalendarDate = (year: number, monthIndex: number, day: number): Date | undefined => {
  const date = new Date(0)

  // `setUTCFullYear` keeps four-digit years below 100 literal, unlike `Date.UTC`.
  date.setUTCFullYear(year, monthIndex, day)

  const exists = date.getUTCFullYear() === year && date.getUTCMonth() === monthIndex && date.getUTCDate() === day

  return exists ? date : undefined
}

const invalidDate = () => new Date(Number.NaN)

export const parseContentDate = (value: Date | string): Date => {
  if (value instanceof Date) return value

  const calendarMatch = calendarDatePattern.exec(value)

  if (calendarMatch) {
    const [, year, month, day] = calendarMatch

    return toUtcCalendarDate(Number(year), Number(month) - 1, Number(day)) ?? invalidDate()
  }

  const dayMonthYearMatch = dayMonthYearPattern.exec(value)

  if (dayMonthYearMatch) {
    const [, day, month = '', year] = dayMonthYearMatch
    const monthIndex = monthAbbreviations.indexOf(month.toLowerCase())

    if (monthIndex === -1) return invalidDate()

    return toUtcCalendarDate(Number(year), monthIndex, Number(day)) ?? invalidDate()
  }

  const timestampMatch = timestampPattern.exec(value)

  if (timestampMatch) {
    const [, year = '', month = '', day = '', time = '', zone = 'Z'] = timestampMatch

    if (!toUtcCalendarDate(Number(year), Number(month) - 1, Number(day))) return invalidDate()

    return new Date(`${year}-${month}-${day}T${time}${zone}`)
  }

  return invalidDate()
}
