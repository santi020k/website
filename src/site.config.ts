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

export const createWhatsAppHref = (message: string = whatsappMessages.default) => `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(message)}`

export const siteConfig: SiteConfig = {
  author: 'Santiago Molina',
  availability: 'Open to tech lead, full-stack, and engineering leadership roles',
  contact: {
    email: 'hi@santi020k.com',
    github: 'https://github.com/santi020k',
    linkedin: 'https://linkedin.com/in/santi020k',
    medium: 'https://medium.com/@santi020k',
    resume: '/pdf/cv.pdf',
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
  description: "I'm Santiago Molina (santi020k), an Engineering leader and full-stack architect specializing in resilient systems, technical leadership, and developer experience. Exploring the intersection of human teams and high-scale software.",
  headline: 'I lead engineering teams, architect resilient systems, and build tools that empower developers.',
  lang: 'en-US',
  location: 'Medellin, Colombia · Remote worldwide',
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
  // Analytics: served zero-code via Cloudflare Pages (project → Settings →
  // Web Analytics). Set a token here only if switching to the in-repo script.
  // analytics: { cloudflareBeaconToken: '<token>' },
  showAvailabilityBanner: false,
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

export const createAuthorSchema = (siteUrl: URL | undefined) => ({
  '@type': 'Person',
  name: siteConfig.author,
  url: siteUrl?.href
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
    title: 'Speaking'
  },
  {
    icon: 'tabler:edit',
    path: '/blog/',
    title: 'Blog'
  }
]
