import { XMLParser } from 'fast-xml-parser'
import { SyntaxValidator } from 'fast-xml-validator'

/** @typedef {{ url: string, lastmod?: string }} SitemapEntry */

const parser = new XMLParser()

/**
 * Product sites can share a hub after a domain migration; fetch that sitemap once.
 * @template {{ origin: string, sitemap: string, required?: boolean }} T
 * @param {T[]} sources
 * @returns {T[]}
 */
export const deduplicateSitemapSources = sources => {
  /** @type {Map<string, T>} */
  const unique = new Map()

  for (const source of sources) {
    const key = new URL(source.sitemap, source.origin).href
    const previous = unique.get(key)

    if (!previous || (previous.required === false && source.required !== false)) {
      unique.set(key, source)
    }
  }

  return [...unique.values()]
}

/** @param {unknown} value @returns {Record<string, unknown>} */
const asRecord = value => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}

  return value
}

/** @param {unknown} value @returns {unknown[]} */
const asArray = value => {
  if (value === undefined) return []

  return Array.isArray(value) ? value : [value]
}

/** @param {string} value */
const escapeXml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&apos;')

/** @param {unknown} value @param {string} origin */
const validateUrl = (value, origin) => {
  if (typeof value !== 'string') throw new Error('Sitemap location must be a URL string')

  const url = new URL(value)

  if (url.origin !== origin || url.protocol !== 'https:') {
    throw new Error(`Sitemap URL uses ${url.origin}; expected HTTPS origin ${origin}`)
  }

  return url.href
}

/** @param {unknown} value @returns {string | undefined} */
const validateLastmod = value => {
  if (value === undefined) return undefined

  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2})))?$/.exec(value) : null

  if (!match || typeof value !== 'string') {
    throw new Error('Sitemap lastmod must be a valid date or timestamp')
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const maxDay = monthDays[month - 1]
  const offsetHour = Number(offsetHourText ?? 0)
  const offsetMinute = Number(offsetMinuteText ?? 0)

  if (!maxDay || day < 1 || day > maxDay ||
    Number(hourText ?? 0) > 23 || Number(minuteText ?? 0) > 59 || Number(secondText ?? 0) > 59 ||
    offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute > 0) ||
    Number.isNaN(Date.parse(value))) {
    throw new Error('Sitemap lastmod must be a valid date or timestamp')
  }

  return value
}

/**
 * Flatten nested sitemaps while keeping each page's actual modification date.
 * @param {{ origin: string, sitemap: string }} source
 * @param {(url: string) => Promise<string>} loadSitemap
 * @returns {Promise<SitemapEntry[]>}
 */
export const collectSitemapEntries = async ({ origin, sitemap }, loadSitemap) => {
  const pending = [new URL(sitemap, origin).href]
  const visited = new Set()
  /** @type {Map<string, SitemapEntry>} */
  const entries = new Map()

  while (pending.length > 0) {
    const sitemapUrl = pending.shift()

    if (!sitemapUrl || visited.has(sitemapUrl)) continue

    validateUrl(sitemapUrl, origin)

    visited.add(sitemapUrl)

    const xml = await loadSitemap(sitemapUrl)

    if (SyntaxValidator.validate(xml) !== true) throw new Error(`${sitemapUrl} contains invalid XML`)

    const document = asRecord(parser.parse(xml))
    const nestedSitemaps = asArray(asRecord(document.sitemapindex).sitemap)
    const pages = asArray(asRecord(document.urlset).url)

    if (nestedSitemaps.length === 0 && pages.length === 0) {
      throw new Error(`${sitemapUrl} is not a sitemap index or URL set`)
    }

    for (const nested of nestedSitemaps) pending.push(validateUrl(asRecord(nested).loc, origin))

    for (const page of pages) {
      const record = asRecord(page)
      const url = validateUrl(record.loc, origin)
      const lastmod = validateLastmod(record.lastmod)
      const previous = entries.get(url)

      // A duplicate without metadata must not erase a date already discovered.
      entries.set(url, lastmod ? { url, lastmod } : previous ?? { url })
    }
  }

  return [...entries.values()]
}

/** @param {SitemapEntry[]} entries */
export const renderSitemap = entries => [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.toSorted((left, right) => left.url.localeCompare(right.url)).map(({ url, lastmod }) => `  <url><loc>${escapeXml(url)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`),
  '</urlset>',
  ''
].join('\n')
