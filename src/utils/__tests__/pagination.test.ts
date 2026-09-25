import { describe, expect, test } from 'vitest'

import {
  BLOG_ARCHIVE_PAGE_SIZE,
  getArchivePageUrl,
  getPaginationItems,
  PAGINATION_GAP
} from '../pagination'

// ─── getArchivePageUrl ────────────────────────────────────────────────────────

describe('getArchivePageUrl', () => {
  test('keeps page one on the bare archive route', () => {
    expect(getArchivePageUrl('/blog/', 1)).toBe('/blog/')
  })

  test('appends later page numbers with a trailing slash', () => {
    expect(getArchivePageUrl('/blog/', 2)).toBe('/blog/2/')
    expect(getArchivePageUrl('/blog/', 12)).toBe('/blog/12/')
  })

  test('works for nested archive bases such as tag pages', () => {
    expect(getArchivePageUrl('/blog/tags/typescript/', 3)).toBe('/blog/tags/typescript/3/')
  })

  test('never emits a slash-less page URL that would trigger a host redirect', () => {
    const urls = [1, 2, 3, 4].map(page => getArchivePageUrl('/blog/', page))

    expect(urls.every(url => url.endsWith('/'))).toBe(true)
  })
})

// ─── getPaginationItems ───────────────────────────────────────────────────────

describe('getPaginationItems', () => {
  test('lists every page when the archive is short', () => {
    expect(getPaginationItems(1, 4)).toEqual([1, 2, 3, 4])
  })

  test('collapses the far range into a single gap', () => {
    expect(getPaginationItems(1, 9)).toEqual([1, 2, PAGINATION_GAP, 9])
  })

  test('renders a lone hidden page instead of an ellipsis standing in for it', () => {
    expect(getPaginationItems(1, 4)).toEqual([1, 2, 3, 4])
    expect(getPaginationItems(4, 4)).toEqual([1, 2, 3, 4])
  })

  test('keeps the first page, both neighbors, and the last page', () => {
    expect(getPaginationItems(5, 9)).toEqual([1, PAGINATION_GAP, 4, 5, 6, PAGINATION_GAP, 9])
  })

  test('never emits two consecutive gaps', () => {
    const items = getPaginationItems(10, 40)
    const consecutiveGaps = items.some(
      (item, index) => item === PAGINATION_GAP && items[index + 1] === PAGINATION_GAP
    )

    expect(consecutiveGaps).toBe(false)
  })

  test('returns a single entry for a one-page archive', () => {
    expect(getPaginationItems(1, 1)).toEqual([1])
  })
})

describe('BLOG_ARCHIVE_PAGE_SIZE', () => {
  test('stays a positive integer so paginate() produces stable page counts', () => {
    expect(Number.isInteger(BLOG_ARCHIVE_PAGE_SIZE)).toBe(true)
    expect(BLOG_ARCHIVE_PAGE_SIZE).toBeGreaterThan(0)
  })
})
