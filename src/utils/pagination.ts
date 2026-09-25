export const BLOG_ARCHIVE_PAGE_SIZE = 12

/** Placeholder rendered between non-adjacent page numbers in a pagination control. */
export const PAGINATION_GAP = 'gap' as const

export type PaginationItem = number | typeof PAGINATION_GAP

/**
 * Builds the canonical URL for a paginated archive page.
 *
 * Page 1 is the bare archive route; later pages append `<n>/`. Astro's own
 * `page.url.prev` / `page.url.next` omit the trailing slash, which costs a host
 * redirect and breaks the repository's trailing-slash convention, so every
 * pagination link is derived from this helper instead.
 *
 * `baseUrl` must already end with a slash (for example `/blog/`).
 */
export const getArchivePageUrl = (baseUrl: string, pageNumber: number) => (
  pageNumber <= 1 ? baseUrl : `${baseUrl}${pageNumber}/`
)

/**
 * Returns the page numbers to render in a pagination control: always the first
 * and last page, plus the pages immediately around the current one.
 *
 * Runs of hidden pages collapse into a single `PAGINATION_GAP` entry, except
 * when the run is one page long — an ellipsis that stands in for a single
 * number costs the same horizontal space while hiding a usable target, so that
 * page is rendered instead.
 */
export const getPaginationItems = (currentPage: number, lastPage: number): PaginationItem[] => {
  const isVisible = (page: number) => page === 1 ||
    page === lastPage ||
    Math.abs(page - currentPage) <= 1

  const items: PaginationItem[] = []

  for (let page = 1; page <= lastPage; page++) {
    if (isVisible(page)) {
      items.push(page)

      continue
    }

    // A lone hidden page is cheaper to show than to hide behind an ellipsis.
    if (isVisible(page - 1) && isVisible(page + 1)) {
      items.push(page)

      continue
    }

    if (items.at(-1) !== PAGINATION_GAP) {
      items.push(PAGINATION_GAP)
    }
  }

  return items
}
