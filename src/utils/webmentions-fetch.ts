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
  const text = isRecord(value) ? asNonEmptyString(value.text) : null

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

/**
 * Loads public webmentions for a canonical page URL from webmention.io (build time).
 * Requires `WEBMENTION_API_KEY` (API token from the webmention.io dashboard).
 */
export const fetchWebmentionsForTarget = async (
  targetUrl: string,
  token: string
): Promise<WebmentionsChildren[]> => {
  const endpoint = new URL('https://webmention.io/api/mentions.jf2')

  endpoint.searchParams.set('target', targetUrl)

  let response: Response

  try {
    response = await fetch(endpoint.href, {
      headers: { Accept: 'application/jf2+json, application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(12_000)
    })
  } catch {
    return []
  }

  if (!response.ok) {
    return []
  }

  let data: unknown

  try {
    data = await response.json()
  } catch {
    return []
  }

  const raw = isRecord(data) ? data.children : undefined

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map(normalizeMention)
    .filter((entry): entry is WebmentionsChildren => entry !== null)
}
