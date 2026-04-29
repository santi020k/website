export interface SiteNewsletter {

  /** `POST` action URL, e.g. `https://buttondown.com/api/emails/embed-subscribe/yourhandle` */
  formAction: string
}

/** Site-wide configuration shape used in site.config.ts */
export interface SiteConfig {
  author: string
  availability: string

  /** When true, show the slim availability banner under the header chrome. */
  showAvailabilityBanner?: boolean
  contact: {
    email: string
    github: string
    linkedin: string
    medium: string
    resume: string
    whatsapp: string
    whatsappPhone: string
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

  /** Leave unset to hide the footer signup form until you add a provider URL. */
  newsletter?: SiteNewsletter
  socialLinks: SiteSocialLink[]
  title: string
}

/** A single navigation link entry (used in menuLinks). */
export interface SiteLink {
  icon?: string
  path: string
  title: string
}

/** A social icon link shown in the footer / sidebar. */
export interface SiteSocialLink {
  href: string
  icon: string
  label: string

  /** When false, skip `rel="me"` (e.g. WhatsApp — not a RelMeAuth silo for IndieAuth.com). */
  indieAuthRelMe?: boolean
}

/** Prev/next pagination link rendered in list pages. */
export interface PaginationLink {
  srLabel?: string
  text?: string
  url: string
}

/** A resource that should be preloaded in the document `<head>`. */
export interface PreloadAsset {
  href: string
  media?: string
  imagesizes?: string
  imagesrcset?: string
  type?: string
}

/** Props accepted by the BaseHead / BaseLayout meta layer. */
export interface SiteMeta {
  articleDate?: string | undefined
  articleUpdated?: string | undefined

  /** Extra JSON-LD object or array of objects (any schema.org type) injected as a second ld+json block */
  structuredData?: Record<string, unknown> | Record<string, unknown>[]

  /** Breadcrumb trail rendered as a BreadcrumbList ld+json block */
  breadcrumbs?: { name: string, url: string }[]
  description?: string
  ogImage?: string | undefined

  /** Describes the actual visual content of the og:image for accessibility and social previews */
  ogImageAlt?: string
  preloadImage?: PreloadAsset
  title: string
}
