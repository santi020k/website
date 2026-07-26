import { YEARS_OF_EXPERIENCE } from '@/site.config'
import { getTechnologyPath } from '@/utils/links'

export interface SocialPageDefinition {
  description: string
  pathname: string
  title: string
  type: string
}

export const homeSocialPage: SocialPageDefinition = {
  description: [
    `Engineering Leader & Full-Stack Architect with ${YEARS_OF_EXPERIENCE} years of experience`,
    'building resilient systems and scaling technical teams.'
  ].join(' '),
  pathname: '/',
  title: 'Engineering Leader & Full-Stack Architect',
  type: 'Homepage'
}

export const staticSocialPages: SocialPageDefinition[] = [
  {
    description:
      `${YEARS_OF_EXPERIENCE} years shipping full-stack products. ` +
      'Senior engineer and tech lead based in Medellin focused on automation, developer experience, and cross-functional leadership.',
    pathname: '/about/',
    title: 'About Santiago Molina - Engineering Leader',
    type: 'About'
  },
  {
    description: 'Practical guides and deep dives into software architecture, full-stack systems, and automation by Santiago Molina.',
    pathname: '/blog/',
    title: 'Software Engineering Blog - Santiago Molina',
    type: 'Blog'
  },
  {
    description:
      'Browse Santiago Molina’s blog series for connected reading tracks on Next.js delivery, ESLint tooling, testing, and software architecture.',
    pathname: '/blog/series/',
    title: 'Blog Series',
    type: 'Blog'
  },
  {
    description:
      'A documented publishing rhythm for upcoming essays, evergreen refreshes, and writing series across Santiago Molina’s engineering blog.',
    pathname: '/blog/content-calendar/',
    title: 'Content Calendar',
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
      'Engineering leader and full-stack architect resume. Explore Santiago Molina’s professional experience, technical skills, and open-source projects.',
    pathname: '/resume/',
    title: 'Resume & Curriculum Vitae',
    type: 'Resume'
  },
  {
    description:
      'Talks, workshops, and engineering conversations about developer experience, technical leadership, frontend architecture, and calmer delivery systems.',
    pathname: '/speaking/',
    title: 'Speaking & Workshops',
    type: 'Speaking'
  },
  {
    description: 'Browse the technologies Santiago Molina uses across frontend architecture, product systems, testing, and delivery.',
    pathname: '/technologies/',
    title: 'Technology Index',
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
