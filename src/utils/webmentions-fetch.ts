import type { WebmentionAuthor, WebmentionContent, WebmentionsChildren, WebmentionSummary } from '@/types/webmentions'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const asNonEmptyString = (value: unknown): string | null => (
  typeof value === 'string' ? value.trim() || null : null
)

/** Accepts only absolute `http(s)` URLs — rejects `javascript:`, `data:`, and other unsafe schemes. */
const asSafeUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  try {
    const { protocol } = new URL(value)

    return protocol === 'http:' || protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

const normalizeAuthor = (value: unknown): WebmentionAuthor | null => {
  if (!isRecord(value)) return null

  const photo: unknown = Array.isArray(value.photo) ? value.photo[0] : value.photo

  return {
    name: asNonEmptyString(value.name),
    photo: asSafeUrl(photo),
    url: asSafeUrl(value.url)
  }
}

const normalizeContent = (value: unknown): WebmentionContent | null => {
  const text = isRecord(value) ?
    asNonEmptyString(value.text) ?? asNonEmptyString(value.value) :
    null

  return text ? { text } : null
}

const normalizeSummary = (value: unknown): WebmentionSummary | null => {
  const text = isRecord(value) ? asNonEmptyString(value.value) : null

  return text ? { value: text } : null
}

/**
 * Validates and normalizes one raw JF2 row into the public `WebmentionsChildren`
 * shape, or returns `null` when it is private or missing what a mention needs to
 * render safely. `author`, `content`, and `summary` come from the sender's own
 * page (third-party, not Santiago-authored) via webmention.io's microformats2
 * parsing, so every field rendered as a URL is checked with `asSafeUrl` — a
 * crafted `javascript:`/`data:` link cannot reach an `href` or image `src`.
 */
const normalizeMention = (entry: unknown): WebmentionsChildren | null => {
  if (!isRecord(entry) || entry['wm-private']) return null

  const property = entry['wm-property']

  if (typeof property !== 'string') return null

  const source = asSafeUrl(entry['wm-source'])

  if (!source) return null

  return {
    author: normalizeAuthor(entry.author),
    content: normalizeContent(entry.content),
    published: asNonEmptyString(entry.published),
    summary: normalizeSummary(entry.summary),
    'wm-property': property,
    'wm-received': asNonEmptyString(entry['wm-received']),
    'wm-source': source
  }
}

/** webmention.io's documented `per-page` maximum. */
const PER_PAGE = 1000
/** Refuse (rather than truncate) feeds larger than `PER_PAGE * MAX_PAGES` mentions. */
const MAX_PAGES = 10
/** Deadline for the whole load: every page request and every body read. */
const LOAD_TIMEOUT_MS = 12_000

interface MentionsPage {
  children: unknown[]
  /** `null` when the response carries no `paging` block (legacy, unpaginated). */
  totalPages: number | null
}

const asNonNegativeInteger = (value: unknown): number | null => {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value

  return typeof number === 'number' && Number.isSafeInteger(number) && number >= 0 ? number : null
}

const mentionId = (entry: unknown): string | null => {
  const id = isRecord(entry) ? entry['wm-id'] : undefined

  return typeof id === 'number' || typeof id === 'string' ? String(id) : null
}

/** Settles with `promise`, or rejects once `signal` aborts — even if `promise` ignores the signal. */
const untilAborted = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> => new Promise((resolve, reject) => {
  const onAbort = () => {
    reject(new Error('Webmention load aborted'))
  }

  if (signal.aborted) {
    onAbort()

    return
  }

  signal.addEventListener('abort', onAbort, { once: true })

  void promise.then(resolve, reject).finally(() => {
    signal.removeEventListener('abort', onAbort)
  })
})

const parsePage = (data: unknown, page: number): MentionsPage | null => {
  if (!isRecord(data) || !Array.isArray(data.children)) return null

  const { children, paging } = data

  if (paging === undefined) return { children, totalPages: null }

  if (!isRecord(paging) || asNonNegativeInteger(paging.page) !== page) return null

  const totalPages = asNonNegativeInteger(paging['total-pages'])

  return totalPages === null ? null : { children, totalPages }
}

/** Fetches one page, or returns `null` on any network, status, body, or shape failure. */
const fetchPage = async (
  targetUrl: string,
  token: string,
  page: number,
  signal: AbortSignal
): Promise<MentionsPage | null> => {
  const endpoint = new URL('https://webmention.io/api/mentions.jf2')

  endpoint.searchParams.set('target', targetUrl)

  endpoint.searchParams.set('per-page', String(PER_PAGE))

  endpoint.searchParams.set('page', String(page))

  endpoint.searchParams.set('sort-by', 'created')

  endpoint.searchParams.set('sort-dir', 'down')

  try {
    const response = await untilAborted(fetch(endpoint.href, {
      headers: { Accept: 'application/jf2+json, application/json', Authorization: `Bearer ${token}` },
      signal
    }), signal)

    if (!response.ok) return null

    const data = await untilAborted<unknown>(response.json(), signal)

    return parsePage(data, page)
  } catch {
    return null
  }
}

/**
 * Walks pages `0..total-pages-1` newest first and returns every raw row, or
 * `null` when the feed cannot be read completely. All-or-nothing on purpose:
 * a partial list would render as a misleading like/reply count.
 *
 * `total-pages` is re-read on every page so a mention arriving mid-walk (which
 * shifts older rows one slot later) still gets its tail page fetched; rows it
 * pushes onto the next page are dropped by `wm-id`.
 */
const fetchAllRows = async (targetUrl: string, token: string, signal: AbortSignal): Promise<unknown[] | null> => {
  const rows: unknown[] = []
  const seenIds = new Set<string>()

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchPage(targetUrl, token, page, signal)

    if (!result) return null

    if (result.totalPages === null) {
      // Without paging metadata, only a first page shorter than `per-page` is provably complete.
      return page === 0 && result.children.length < PER_PAGE ? result.children : null
    }

    if (result.totalPages > MAX_PAGES || (page > 0 && page >= result.totalPages)) return null

    let added = 0

    for (const row of result.children) {
      const id = mentionId(row)

      if (id !== null) {
        if (seenIds.has(id)) continue

        seenIds.add(id)
      }

      rows.push(row)

      added++
    }

    // An empty first page is valid, but a later repeated or empty page cannot
    // establish a complete result, even when it claims to be the last page.
    if (added === 0 && (page > 0 || result.totalPages > 1)) return null

    if (page + 1 >= result.totalPages) return rows
  }

  return null
}

/**
 * Loads public webmentions for a canonical page URL from webmention.io (build time).
 * Requires `WEBMENTION_API_KEY` (API token from the webmention.io dashboard).
 * Returns every public mention newest first, or `[]` when the feed cannot be
 * loaded completely within `LOAD_TIMEOUT_MS`.
 */
export const fetchWebmentionsForTarget = async (
  targetUrl: string,
  token: string
): Promise<WebmentionsChildren[]> => {
  const controller = new AbortController()

  const timer = setTimeout(() => {
    controller.abort()
  }, LOAD_TIMEOUT_MS)

  try {
    const rows = await fetchAllRows(targetUrl, token, controller.signal)

    return (rows ?? [])
      .map(normalizeMention)
      .filter((entry): entry is WebmentionsChildren => entry !== null)
  } finally {
    clearTimeout(timer)
  }
}
