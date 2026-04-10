/** Root Webmentions feed payload returned by the Webmention API. */
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

/** A single Webmention entry (like, reply, repost, bookmark, etc.). */
export interface WebmentionsChildren {
  author: WebmentionAuthor | null
  content?: WebmentionContent | null
  'mention-of': string
  name?: null | string
  photo?: null | string[]
  published?: null | string
  rels?: WebmentionRels | null
  summary?: WebmentionSummary | null
  syndication?: null | string[]
  type: string
  url: string
  'wm-id': number
  'wm-private': boolean
  'wm-property': string
  'wm-protocol': string
  'wm-received': string
  'wm-source': string
  'wm-target': string
}

export interface WebmentionAuthor {
  name: string
  photo: string
  type: string
  url: string
}

export interface WebmentionContent {
  'content-type': string
  html: string
  text: string
  value: string
}

export interface WebmentionRels {
  canonical: string
}

export interface WebmentionSummary {
  'content-type': string
  value: string
}
