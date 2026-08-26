/**
 * Pre-build OG image generator.
 *
 * Generates all Open Graph images and writes them to `public/og/` so Astro can
 * serve them as static passthrough files (zero build-time cost).
 *
 * Run via: `pnpm run generate:og` or automatically as part of `prebuild`.
 *
 * Strategy:
 *  - Uses @santi020k/og's framework-neutral content and archive collectors
 *  - Shares page copy with route-manifest metadata and generated image data
 *  - Normalizes local cover art and project logos for reliable SVG embedding
 *  - Applies the branded preset, measured Montserrat typography, and Sharp WebP
 *  - Uses content-aware caching, bounded concurrency, and tracked cleanup
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createCards, pathnameOutput } from '@santi020k/og'
import {
  collectContentCards,
  getFrontmatterValue,
  groupArchive,
  paginateArchive,
  resolveContentAsset
} from '@santi020k/og/content'
import { definePageMetadata } from '@santi020k/og/metadata'
import { definePresetConfig } from '@santi020k/og/presets'

import { BLOG_ARCHIVE_PAGE_SIZE } from '../../src/utils/pagination.ts'

import { prepareOgImage } from './prepare-og-image.mjs'
import { renderOgAtmosphere } from './render-og-atmosphere.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const OUT_DIR = path.join(ROOT, 'public', 'og')

const BRAND_LOGO = fileURLToPath(import.meta.resolve(
  '@santi020k/theme/assets/logos/logo-square.png'
))

const BRAND_FONT = 'public/fonts/montserrat-variable-font-wght.ttf'

const PROJECT_LOGO_SURFACES = {
  dark: '#0f172a',
  light: '#f8fafc',
  neutral: '#e2e8f0'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getSocialImageFileName = pathname => pathnameOutput(pathname)

const getTechnologySlug = technology => technology
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replaceAll('&', ' and ')
  .replaceAll('+', ' plus ')
  .replaceAll('#', ' sharp ')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const topicNames = new Map([
  ['ai', 'AI'],
  ['api', 'API'],
  ['css', 'CSS'],
  ['dx', 'DX'],
  ['eslint', 'ESLint'],
  ['git', 'Git'],
  ['graphql', 'GraphQL'],
  ['html', 'HTML'],
  ['ios', 'iOS'],
  ['javascript', 'JavaScript'],
  ['macos', 'macOS'],
  ['mongodb', 'MongoDB'],
  ['nextjs', 'Next.js'],
  ['nodejs', 'Node.js'],
  ['qa', 'QA'],
  ['react', 'React'],
  ['typescript', 'TypeScript'],
  ['ui', 'UI'],
  ['ux', 'UX'],
  ['vitest', 'Vitest'],
  ['vscode', 'VS Code']
])

export const formatTopicName = topic => {
  const knownName = topicNames.get(topic.toLowerCase())

  if (knownName) return knownName

  return topic
    .split(/[ -]+/u)
    .map((part, index) => topicNames.get(part.toLowerCase()) ?? (
      index === 0 ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part
    ))
    .join(' ')
}

// ---------------------------------------------------------------------------
// Collect image specs
// ---------------------------------------------------------------------------
const yearsOfExperience = `${new Date().getFullYear() - 2014}+`

/** Static page definitions (mirrors `src/data/social-pages.ts`). */
const staticSocialPages = [
  {
    description:
      `Engineering Leader & Full-Stack Architect with ${yearsOfExperience} years of ` +
      'experience building resilient systems and scaling technical teams.',
    pathname: '/',
    title: 'Engineering Leader & Full-Stack Architect',
    badge: 'Homepage'
  },
  {
    description:
      `${yearsOfExperience} years shipping full-stack products. ` +
      'Senior engineer and tech lead based in Medellin focused on automation, developer experience, and cross-functional leadership.',
    pathname: '/about/',
    title: 'About Santiago Molina - Engineering Leader',
    badge: 'About'
  },
  {
    description:
      'Practical guides and deep dives into software architecture, full-stack systems, and automation by Santiago Molina.',
    pathname: '/blog/',
    title: 'Software Engineering Blog - Santiago Molina',
    badge: 'Blog'
  },
  {
    description:
      'A practical guide to developer experience: measure delivery friction, encode useful standards, automate verification, and help teams ship confidently.',
    pathname: '/developer-experience/',
    title: 'Developer Experience & Engineering Quality',
    badge: 'Guide'
  },
  {
    description:
      'Browse Santiago Molina\'s blog series for connected reading tracks on Next.js delivery, ESLint tooling, testing, and software architecture.',
    pathname: '/blog/series/',
    title: 'Blog Series',
    badge: 'Blog'
  },
  {
    description:
      'A documented publishing rhythm for upcoming essays, evergreen refreshes, and writing series across Santiago Molina\'s engineering blog.',
    pathname: '/blog/content-calendar/',
    title: 'Content Calendar',
    badge: 'Blog'
  },
  {
    description:
      'Browse the blog archive by recurring topics and tags across architecture, automation, DX, and engineering workflow.',
    pathname: '/blog/tags/',
    title: 'Blog Topics',
    badge: 'Blog'
  },
  {
    description:
      'A curated showcase of professional engineering projects, open-source contributions, and technical experiments across headless commerce, gaming, and SaaS.',
    pathname: '/portfolio/',
    title: 'Engineering Portfolio - Santiago Molina',
    badge: 'Portfolio'
  },
  {
    description:
      'Client and product work across headless commerce, gaming, SaaS, real estate, and martech — architecture decisions, delivery systems, and hands-on technical leadership.',
    pathname: '/work/',
    title: 'Work Experience — Santiago Molina',
    badge: 'Work'
  },
  {
    description:
      'Open-source tools and self-directed experiments — the projects I build to learn, share, and sharpen how I engineer beyond client work.',
    pathname: '/projects/',
    title: 'Side Projects — Santiago Molina',
    badge: 'Projects'
  },
  {
    description:
      'Engineering leader and full-stack architect resume. Explore Santiago Molina’s professional experience, technical skills, and community leadership.',
    pathname: '/resume/',
    title: 'Resume & Curriculum Vitae',
    badge: 'Resume'
  },
  {
    description:
      'Talks, workshops, and community work around developer experience, technical leadership, frontend architecture, and practical knowledge sharing.',
    pathname: '/speaking/',
    title: 'Speaking & Community',
    badge: 'Speaking'
  },
  {
    description:
      'Browse the technologies Santiago Molina uses across frontend architecture, product systems, testing, and delivery.',
    pathname: '/technologies/',
    title: 'Technology Index',
    badge: 'Technology'
  },
  {
    description:
      'Accessibility commitment for santi020k.com: WCAG 2.2 AA as the target, practical limits of a solo-maintained site, and how to report barriers.',
    pathname: '/accessibility/',
    title: 'Accessibility statement',
    badge: 'Accessibility'
  },
  {
    description:
      'How santi020k.com handles data: no ad trackers, no profiling, just a static site with a theme preference.',
    pathname: '/privacy/',
    title: 'Privacy & analytics',
    badge: 'Legal'
  },
  {
    description:
      'Terms for using santi020k.com, including acceptable use, intellectual property, external links, and limitations.',
    pathname: '/terms/',
    title: 'Terms & Conditions',
    badge: 'Legal'
  },
  {
    description: 'Offline fallback page for the santi020k portfolio and blog.',
    pathname: '/offline/',
    title: 'Offline',
    badge: 'Status'
  },
  {
    description: 'The page you are looking for could not be found.',
    pathname: '/404/',
    title: 'Page not found',
    badge: 'Status'
  }
]

const includeDrafts = process.env.OG_INCLUDE_DRAFTS === '1'

const nonIndexableStaticPathnames = new Set([
  '/404/',
  '/blog/content-calendar/',
  '/offline/'
])

export const isPublishedPost = entry => {
  if (includeDrafts) return true

  const value = getFrontmatterValue(entry, 'publishDate')
  let publishTime = Number.NaN

  if (value instanceof Date) publishTime = value.getTime()
  else if (typeof value === 'string') publishTime = Date.parse(value)

  return Number.isFinite(publishTime) && publishTime <= Date.now()
}

const archiveCard = (pathname, title, description, badge) => ({
  data: { badge, description, domain: pathname, title, variant: 'simple' },
  output: `pages/${getSocialImageFileName(pathname)}`,
  route: { description, pathname, title }
})

export const collectCards = async () => {
  const staticPages = staticSocialPages.map(page => definePageMetadata({
    badge: page.badge,
    description: page.description,
    image: {
      alt: `${page.title} — Santiago Molina`,
      output: `pages/${getSocialImageFileName(page.pathname)}`
    },
    pathname: page.pathname,
    title: page.title,
    type: page.pathname === '/about/' ? 'profile' : 'website'
  }))

  const staticCards = createCards(staticPages, page => ({
    badge: page.badge,
    description: page.description,
    domain: page.pathname,
    title: page.title,
    variant: 'simple'
  }), {
    output: page => page.image.output,
    route: page => {
      if (nonIndexableStaticPathnames.has(page.pathname)) return undefined

      return {
        alt: page.image.alt,
        description: page.description,
        pathname: page.pathname,
        title: page.title
      }
    }
  })

  const postCards = await collectContentCards({
    archives: [
      paginateArchive({
        basePath: '/blog/',
        data: context => ({
          badge: 'Blog',
          description: 'Practical guides and deep dives into software architecture, full-stack systems, and automation by Santiago Molina.',
          domain: context.pathname,
          title: `Blog · Page ${context.pageNumber}`,
          variant: 'simple'
        }),
        includeFirst: false,
        output: context => `pages/${getSocialImageFileName(context.pathname)}`,
        pageSize: BLOG_ARCHIVE_PAGE_SIZE
      }),
      groupArchive({
        basePath: '/blog/tags/',
        data: context => {
          const topic = formatTopicName(context.group)

          return {
            badge: 'Topic',
            description: `Explore ${topic} posts on architecture, automation, DX, and engineering workflow.`,
            domain: context.pathname,
            title: context.pageNumber === 1 ? `${topic} posts` : `${topic} posts · Page ${context.pageNumber}`,
            variant: 'simple'
          }
        },
        field: 'tags',
        output: context => `pages/${getSocialImageFileName(context.pathname)}`,
        pageSize: BLOG_ARCHIVE_PAGE_SIZE,
        slug: group => encodeURIComponent(group)
      })
    ],
    basePath: 'blog',
    directory: 'src/content/post',
    filter: isPublishedPost,
    includeDrafts,
    map: async entry => {
      const id = entry.slug.split('/').at(-1) ?? entry.slug
      const coverImagePath = await resolveContentAsset(entry, getFrontmatterValue(entry, 'coverImage.src'))

      return {
        badge: 'Blog Post',
        ...(coverImagePath ?
          {
            coverImagePath,
            image: await prepareOgImage(coverImagePath)
          } :
          {}),
        description: entry.frontmatter.description ?? '',
        domain: `/blog/${id}/`,
        title: entry.frontmatter.title ?? id,
        variant: coverImagePath ? 'article' : 'simple'
      }
    },
    output: entry => `blog/${entry.slug.split('/').at(-1)}.webp`,
    route: entry => `/blog/${entry.slug.split('/').at(-1)}/`,
    root: ROOT,
    sources: (entry, data) => data.coverImagePath ? [entry.filePath, data.coverImagePath] : [entry.filePath]
  })

  const technologies = new Map()

  const projectCards = await collectContentCards({
    aggregate: entries => {
      for (const entry of entries) {
        if (!includeDrafts && entry.frontmatter.draft === true) continue

        const values = entry.frontmatter.technologies

        if (!Array.isArray(values)) continue

        for (const tech of values) {
          if (typeof tech !== 'string') continue

          const slug = getTechnologySlug(tech)

          if (slug === 'ci-cd') technologies.set(slug, 'CI/CD')
          else if (slug === 'npm') technologies.set(slug, 'NPM')
          else if (!technologies.has(slug)) technologies.set(slug, tech)
        }
      }

      return []
    },
    directory: 'src/content/project',
    basePath: 'portfolio',
    includeDrafts,
    map: async entry => {
      const logoImagePath = await resolveContentAsset(
        entry,
        getFrontmatterValue(entry, 'coverImage.logo')
      )

      return {
        badge: entry.frontmatter.typesId === 'community' ? 'Community work' : 'Project',
        ...(logoImagePath ?
          {
            image: logoImagePath,
            imagePresentation: {
              background: PROJECT_LOGO_SURFACES[
                getFrontmatterValue(entry, 'coverImage.logoSurface')
              ] ?? PROJECT_LOGO_SURFACES.dark,
              fit: 'contain',
              padding: 50
            },
            logoImagePath
          } :
          {}),
        description: entry.frontmatter.seoDescription ?? entry.frontmatter.description ?? '',
        domain: `/portfolio/${entry.slug}/`,
        title: entry.frontmatter.title ?? entry.slug,
        variant: logoImagePath ? 'product' : 'simple'
      }
    },
    output: entry => `portfolio/${entry.slug}.webp`,
    root: ROOT,
    sources: (entry, data) => data.logoImagePath ? [entry.filePath, data.logoImagePath] : [entry.filePath]
  })

  const seriesCards = await collectContentCards({
    basePath: 'blog/series',
    directory: 'src/content/series',
    map: entry => ({
      badge: 'Blog Series',
      description: entry.frontmatter.seoDescription ?? entry.frontmatter.description ?? '',
      domain: `/blog/series/${entry.slug}/`,
      title: entry.frontmatter.seoTitle ?? entry.frontmatter.title ?? entry.slug,
      variant: 'simple'
    }),
    output: entry => `pages/${getSocialImageFileName(`/blog/series/${entry.slug}/`)}`,
    root: ROOT
  })

  const technologyCards = [...technologies].map(([slug, technology]) => {
    const pathname = `/technologies/${slug}/`

    const card = archiveCard(
      `/technologies/${encodeURIComponent(technology)}/`,
      `${technology} · Technology`,
      `Projects and case studies where ${technology} shaped the architecture, delivery workflow, or product experience.`,
      'Technology'
    )

    return {
      ...card,
      data: { ...card.data, domain: pathname },
      output: `pages/technologies--${encodeURIComponent(technology).replaceAll('%', '~')}.webp`,
      route: { ...card.route, pathname }
    }
  })

  return [...staticCards, ...postCards, ...projectCards, ...seriesCards, ...technologyCards]
    .map(card => card.route ?
      {
        ...card,
        route: {
          alt: `${card.data.title} — Santiago Molina`,
          description: card.data.description,
          title: card.data.title,
          ...card.route
        }
      } :
      card)
}

export const collectSpecs = async () => (await collectCards()).map(card => ({
  outFile: path.join(OUT_DIR, card.output),
  props: {
    ...(card.data.coverImagePath ? { coverImagePath: card.data.coverImagePath } : {}),
    ...(card.data.logoImagePath ? { logoImagePath: card.data.logoImagePath } : {}),
    description: card.data.description,
    pathLabel: card.data.domain,
    title: card.data.title,
    type: card.data.badge
  }
}))

export default definePresetConfig({
  cache: {
    key: 'santi020k-social-cards-v3',
    sources: [
      BRAND_LOGO,
      'scripts/js/prepare-og-image.mjs',
      'scripts/js/render-og-atmosphere.mjs'
    ]
  },
  cards: collectCards,
  clean: true,
  concurrency: 'auto',
  outputDirectory: 'public/og',
  routeManifest: { file: 'public/og/manifest.json', publicPath: '/og' },
  preset: {
    brand: { domain: 'santi020k.com', logo: BRAND_LOGO, name: 'Santiago Molina' },
    decoration: renderOgAtmosphere,
    sharp: { webp: { effort: 6, quality: 90, smartSubsample: true } },
    theme: {
      accent: '#9b66ff',
      background: '#0c0715',
      foreground: '#f1edf8',
      muted: '#c7c0d2',
      panel: '#1a1426'
    },
    typography: { family: 'Montserrat', file: BRAND_FONT }
  },
  root: ROOT
})
