import type { SiteConfig, SiteLink } from './types/site'

export const CAREER_START_YEAR = 2014
export const WRITING_START_YEAR = 2017

const whatsappPhone = '573507990136'

export const whatsappMessages = {
  default:
    'Hi Santiago, I found your website and would like to talk about a role, project, or technical collaboration. Here is a bit of context:',
  speaking:
    'Hi Santiago, I found your speaking page and would like to invite you to a talk or workshop. Event: Audience: Date: Format: Goal:'
} as const

export const createWhatsAppHref = (message: string = whatsappMessages.default) => {
  const text = encodeURIComponent(message)

  return `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${text}`
}

export const siteConfig: SiteConfig = {
  author: 'Santiago Molina',
  availability: 'Available for tech lead, staff-level full-stack, and engineering leadership roles',
  contact: {
    email: 'hi@santi020k.com',
    github: 'https://github.com/santi020k',
    linkedin: 'https://linkedin.com/in/santi020k',
    medium: 'https://medium.com/@santi020k',
    resume: '/resume/',
    whatsapp: createWhatsAppHref(),
    whatsappPhone
  },
  date: {
    locale: 'en-US',
    options: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  },
  description: 'Engineering leader and full-stack architect helping teams modernize systems, automate delivery, and improve developer experience.',
  headline: 'I help teams modernize systems, automate delivery, and improve developer experience.',
  lang: 'en-US',
  location: 'Medellín, Colombia · Remote worldwide',
  ogLocale: 'en_US',
  newsletter: {
    archiveFeedUrl: 'https://buttondown.com/santi020k/rss',
    formAction: 'https://buttondown.com/api/emails/embed-subscribe/santi020k'
  },
  giscus: {
    category: 'General',
    categoryId: 'DIC_kwDOPRBHL84C--ud',
    repo: 'santi020k/website',
    repoId: 'R_kgDOPRBHLw'
  },
  showAvailabilityBanner: false,
  siteName: 'santi020k',
  socialLinks: [
    {
      href: 'https://linkedin.com/in/santi020k',
      icon: 'tabler:brand-linkedin',
      label: 'LinkedIn'
    },
    {
      href: 'https://github.com/santi020k',
      icon: 'tabler:brand-github',
      label: 'GitHub'
    },
    {
      href: 'https://medium.com/@santi020k',
      icon: 'tabler:brand-medium',
      label: 'Medium'
    },
    {
      href: createWhatsAppHref(),
      icon: 'tabler:brand-whatsapp',
      indieAuthRelMe: false,
      label: 'WhatsApp'
    }
  ],
  title: 'Santiago Molina | santi020k'
}

export const sameAsProfiles: string[] = [
  siteConfig.contact.github,
  siteConfig.contact.linkedin,
  siteConfig.contact.medium,
  'https://twitter.com/santi020k',
  'https://x.com/santi020k'
].filter(Boolean)

export const AUTHOR_JOB_TITLE = 'Engineering Leader & Full-Stack Architect'

export const YEARS_OF_EXPERIENCE = `${new Date().getFullYear() - CAREER_START_YEAR}+`
export const YEARS_OF_WRITING = `${new Date().getFullYear() - WRITING_START_YEAR}+`

const defaultSiteUrl = new URL('https://santi020k.com/')

export type SchemaEntity = 'organization' | 'person' | 'website'

export const createSchemaEntityId = (entity: SchemaEntity, siteUrl?: URL) => new URL(`#${entity}`, siteUrl ?? defaultSiteUrl).href

export const createAuthorSchema = (siteUrl: URL | undefined) => ({
  '@type': 'Person',
  '@id': createSchemaEntityId('person', siteUrl),
  name: siteConfig.author,
  url: new URL('/about/', siteUrl ?? defaultSiteUrl).href
})

export const createPublisherSchema = (siteUrl: URL | undefined) => ({
  '@type': 'Organization',
  '@id': createSchemaEntityId('organization', siteUrl)
})

export const createWebsiteSchemaReference = (siteUrl: URL | undefined) => ({
  '@type': 'WebSite',
  '@id': createSchemaEntityId('website', siteUrl)
})

export const menuLinks: SiteLink[] = [
  {
    icon: 'tabler:home-2',
    path: '/',
    title: 'Home'
  },
  {
    icon: 'tabler:user-circle',
    path: '/about/',
    title: 'About'
  },
  {
    icon: 'tabler:timeline',
    path: '/work/',
    title: 'Work'
  },
  {
    icon: 'tabler:layers-intersect',
    path: '/projects/',
    title: 'Projects'
  },
  {
    icon: 'tabler:speakerphone',
    path: '/speaking/',
    title: 'Speaking & Community'
  },
  {
    icon: 'tabler:edit',
    path: '/blog/',
    title: 'Blog'
  }
]
