/** Webmentions feed with normalized entries. */
export interface WebmentionsFeed {
  children: WebmentionsChildren[]
  name: string
  type: string
}

/** Cached Webmentions data stored locally to reduce API calls. */
export interface WebmentionsCache {
  children: WebmentionsChildren[]
  lastFetched: null | string
}

/**
 * A single public Webmention entry (like, reply, repost, bookmark, etc.),
 * normalized by `fetchWebmentionsForTarget` from third-party, sender-controlled
 * microformats2 data. Every field here reflects what that normalization step
 * actually guarantees — in particular, `url`-shaped fields are verified to be
 * absolute `http(s)` URLs so they are safe to render as `href`/`src`.
 */
export interface WebmentionsChildren {
  author: WebmentionAuthor | null
  content: WebmentionContent | null
  published: string | null
  summary: WebmentionSummary | null
  'wm-property': string
  'wm-received': string | null
  'wm-source': string
}

/** Author of a Webmention, normalized from the sender's microformats2 h-card. */
export interface WebmentionAuthor {
  name: string | null
  photo: string | null
  url: string | null
}

export interface WebmentionContent {
  text: string
}

export interface WebmentionSummary {
  value: string
}
