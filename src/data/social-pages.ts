import { getTechnologyPath } from '@/utils/links'

import { YEARS_OF_EXPERIENCE } from '@/site.config'

export interface SocialPageDefinition {
  description: string
  pathname: string
  title: string
  type: string
}

export const homeSocialPage: SocialPageDefinition = {
  description: 'Engineering leader and full-stack architect helping teams modernize systems, automate delivery, and improve developer experience.',
  pathname: '/',
  title: 'Engineering Leader & Full-Stack Architect',
  type: 'Homepage'
}

export const staticSocialPages: SocialPageDefinition[] = [
  {
    description:
      `Santiago Molina is a Medellín-based engineering leader and full-stack architect with ${YEARS_OF_EXPERIENCE} years ` +
      'building products, delivery systems, and developer teams.',
    pathname: '/about/',
    title: 'About Santiago Molina — Engineering Leader',
    type: 'About'
  },
  {
    description: 'Notes on software, reading, gaming, and everyday discoveries by Santiago Molina.',
    pathname: '/blog/',
    title: 'Personal Blog - Santiago Molina',
    type: 'Blog'
  },
  {
    description:
      'A practical guide to developer experience: measure delivery friction, encode useful standards, automate verification, and help teams ship confidently.',
    pathname: '/developer-experience/',
    title: 'Developer Experience & Engineering Quality',
    type: 'Guide'
  },
  {
    description:
      'Browse Santiago Molina’s blog series for connected reading tracks on Next.js delivery, ESLint tooling, testing, and software architecture.',
    pathname: '/blog/series/',
    title: 'Blog Series',
    type: 'Blog'
  },
  {
    description: 'A curated showcase of professional engineering projects, open-source contributions, and technical experiments across headless commerce, gaming, and SaaS.',
    pathname: '/portfolio/',
    title: 'Engineering Portfolio - Santiago Molina',
    type: 'Portfolio'
  },
  {
    description:
      'Open-source tools and self-directed experiments — the projects I build to learn, share, and sharpen how I engineer beyond client work.',
    pathname: '/projects/',
    title: 'Side Projects — Santiago Molina',
    type: 'Projects'
  },
  {
    description:
      'Engineering leader and full-stack architect resume. Explore Santiago Molina’s professional experience, technical skills, and community leadership.',
    pathname: '/resume/',
    title: 'Resume & Curriculum Vitae',
    type: 'Resume'
  },
  {
    description:
      'Talks, workshops, and community work around developer experience, technical leadership, frontend architecture, and practical knowledge sharing.',
    pathname: '/speaking/',
    title: 'Speaking & Community',
    type: 'Speaking'
  },
  {
    description: 'Browse Santiago Molina’s capabilities and technologies across frontend architecture, product systems, testing, and delivery.',
    pathname: '/technologies/',
    title: 'Capabilities & Technologies',
    type: 'Technology'
  },
  {
    description: 'Offline fallback page for the santi020k portfolio and blog.',
    pathname: '/offline/',
    title: 'Offline',
    type: 'Status'
  },
  {
    description: 'The page you are looking for could not be found.',
    pathname: '/404/',
    title: 'Page not found',
    type: 'Status'
  }
]

export const getTechnologySocialPage = (technology: string): SocialPageDefinition => ({
  description:
    `Projects and case studies where ${technology} shaped the architecture, ` +
    'delivery workflow, or product experience.',
  pathname: getTechnologyPath(technology),
  title: `${technology} · Technology`,
  type: 'Technology'
})
