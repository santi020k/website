export interface SiteConfig {
  author: string
  availability: string
  contact: {
    email: string
    github: string
    linkedin: string
    medium: string
    resume: string
    whatsapp: string
  }
  date: {
    locale: string | string[] | undefined
    options: Intl.DateTimeFormatOptions
  }
  description: string
  headline: string
  lang: string
  location: string
  ogLocale: string
  socialLinks: SiteSocialLink[]
  title: string
}

export interface SiteLink {
  path: string
  title: string
}

export interface SiteSocialLink {
  href: string
  icon: string
  label: string
}

export interface PaginationLink {
  srLabel?: string
  text?: string
  url: string
}

export interface SiteMeta {
  articleDate?: string | undefined
  description?: string
  ogImage?: string | undefined
  title: string
}

/** Webmentions */
export interface WebmentionsFeed {
  children: WebmentionsChildren[]
  name: string
  type: string
}

export interface WebmentionsCache {
  children: WebmentionsChildren[]
  lastFetched: null | string
}

export interface WebmentionsChildren {
  author: Author | null
  content?: Content | null
  'mention-of': string
  name?: null | string
  photo?: null | string[]
  published?: null | string
  rels?: Rels | null
  summary?: Summary | null
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

export interface Author {
  name: string
  photo: string
  type: string
  url: string
}

export interface Content {
  'content-type': string
  html: string
  text: string
  value: string
}

export interface Rels {
  canonical: string
}

export interface Summary {
  'content-type': string
  value: string
}

export type AdmonitionType = 'tip' | 'note' | 'important' | 'caution' | 'warning'

export interface Badge {
  variant?:
    | 'default' |
    'accent' |
    'accent-base' |
    'accent-one' |
    'accent-two' |
    'muted' |
    'outline'
  showHash?: boolean
  title: string
}

export interface MediumPost {
  author: string
  excerpt: string
  guid: string
  imageUrl: null | string
  link: string
  publication: string
  publishedAt: string
  slug: string
  tags: string[]
  title: string
  updatedAt: string
}
