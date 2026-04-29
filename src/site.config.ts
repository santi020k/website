import type { SiteConfig, SiteLink } from './types/site'

const whatsappPhone = '573507990136'

export const whatsappMessages = {
  default:
    'Hi Santiago, I found your website and would like to talk about a role, project, or technical collaboration. Here is a bit of context:',
  speaking:
    'Hi Santiago, I found your speaking page and would like to invite you to a talk or workshop. Event: Audience: Date: Format: Goal:'
} as const

export const createWhatsAppHref = (message: string = whatsappMessages.default) =>
  `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(message)}`

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
  description: 'Engineering leader and full-stack architect specializing in resilient systems, technical leadership, and developer experience. Exploring the intersection of human teams and high-scale software.',
  headline: 'I lead engineering teams, architect resilient systems, and build tools that empower developers.',
  lang: 'en-US',
  location: 'Medellin, Colombia · Remote worldwide',
  ogLocale: 'en_US',
  newsletter: { formAction: 'https://buttondown.com/api/emails/embed-subscribe/santi020k' },
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
  title: 'Santiago Molina'
}

export const menuLinks: SiteLink[] = [
  {
    icon: 'tabler:home',
    path: '/',
    title: 'Home'
  },
  {
    icon: 'tabler:user',
    path: '/about/',
    title: 'About'
  },
  {
    icon: 'tabler:briefcase',
    path: '/portfolio/',
    title: 'Portfolio'
  },
  {
    icon: 'tabler:microphone',
    path: '/speaking/',
    title: 'Speaking'
  },
  {
    icon: 'tabler:pencil',
    path: '/blog/',
    title: 'Blog'
  }
]
