/**
 * Pre-build OG image generator.
 *
 * Generates all Open Graph images and writes them to `public/og/` so Astro can
 * serve them as static passthrough files (zero build-time cost).
 *
 * Run via: `pnpm run generate:og` or automatically as part of `prebuild`.
 *
 * Strategy:
 *  - Reads content frontmatter directly with `js-yaml` (no Astro runtime needed)
 *  - Collects all image specs (pages, posts, projects, series, technologies)
 *  - Renders CPU-heavy cards in a `worker_threads` pool (Satori + Resvg + Sharp
 *    run in separate isolates; async concurrency on one thread does not scale)
 *  - Skips images whose output file already exists (set FORCE_OG=1 to regenerate)
 *
 * Tuning: `OG_WORKER_THREADS` caps how many worker threads are spawned (default
 * `min(16, os.availableParallelism())`).
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const OUT_DIR = path.join(ROOT, 'public', 'og')
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
    type: 'Homepage'
  },
  {
    description:
      `${yearsOfExperience} years shipping full-stack products. ` +
      'Senior engineer and tech lead based in Medellin focused on automation, developer experience, and cross-functional leadership.',
    pathname: '/about/',
    title: 'About Santiago Molina - Engineering Leader',
    type: 'About'
  },
  {
    description:
      'Practical guides and deep dives into software architecture, full-stack systems, and automation by Santiago Molina.',
    pathname: '/blog/',
    title: 'Software Engineering Blog - Santiago Molina',
    type: 'Blog'
  },
  {
    description:
      'Browse Santiago Molina\'s blog series for connected reading tracks on Next.js delivery, ESLint tooling, testing, and software architecture.',
    pathname: '/blog/series/',
    title: 'Blog Series',
    type: 'Blog'
  },
  {
    description:
      'A documented publishing rhythm for upcoming essays, evergreen refreshes, and writing series across Santiago Molina\'s engineering blog.',
    pathname: '/blog/content-calendar/',
    title: 'Content Calendar',
    type: 'Blog'
  },
  {
    description:
      'Browse the blog archive by recurring topics and tags across architecture, automation, DX, and engineering workflow.',
    pathname: '/blog/tags/',
    title: 'Blog Topics',
    type: 'Blog'
  },
  {
    description:
      'A curated showcase of professional engineering projects, open-source contributions, and technical experiments across headless commerce, gaming, and SaaS.',
    pathname: '/portfolio/',
    title: 'Engineering Portfolio - Santiago Molina',
    type: 'Portfolio'
  },
  {
    description:
      'Client and product work across headless commerce, gaming, SaaS, real estate, and martech — architecture decisions, delivery systems, and hands-on technical leadership.',
    pathname: '/work/',
    title: 'Work Experience — Santiago Molina',
    type: 'Work'
  },
  {
    description:
      'Open-source tools, community work, and self-directed experiments — the projects Santiago Molina builds to learn, share, and sharpen engineering craft.',
    pathname: '/projects/',
    title: 'Side Projects — Santiago Molina',
    type: 'Projects'
  },
  {
    description:
      'Engineering leader and full-stack architect resume. Explore Santiago Molina\'s professional experience, technical skills, and open-source projects.',
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
    description:
      'Browse the technologies Santiago Molina uses across frontend architecture, product systems, testing, and delivery.',
    pathname: '/technologies/',
    title: 'Technology Index',
    type: 'Technology'
  },
  {
    description:
      'Accessibility commitment for santi020k.com: WCAG 2.2 AA as the target, practical limits of a solo-maintained site, and how to report barriers.',
    pathname: '/accessibility/',
    title: 'Accessibility statement',
    type: 'Accessibility'
  },
  {
    description:
      'How santi020k.com handles data: no ad trackers, no profiling, just a static site with a theme preference.',
    pathname: '/privacy/',
    title: 'Privacy & analytics',
    type: 'Legal'
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
    description: page.description,
    image: {
      alt: `${page.title} — Santiago Molina`,
      output: `pages/${getSocialImageFileName(page.pathname)}`
    },
    pathname: page.pathname,
    title: page.title,
    type: page.type
  }))

  const staticCards = createCards(staticPages, page => ({
    badge: page.type,
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
        pageSize: 9
      }),
      groupArchive({
        basePath: '/blog/tags/',
        data: context => ({
          badge: 'Topic',
          description: `Posts tagged ${context.group} across architecture, automation, developer experience, and engineering workflow.`,
          domain: context.pathname,
          title: context.pageNumber === 1 ? `${context.group} Posts` : `${context.group} Posts · Page ${context.pageNumber}`,
          variant: 'simple'
        }),
        field: 'tags',
        output: context => `pages/${getSocialImageFileName(context.pathname)}`,
        pageSize: 9,
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
        ...(coverImagePath ? { coverImagePath, image: coverImagePath } : {}),
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
      const coverImagePath = await resolveContentAsset(
        entry,
        getFrontmatterValue(entry, 'coverImage.ogImage')
      ) ?? await resolveContentAsset(entry, getFrontmatterValue(entry, 'coverImage.src'))

      return {
        badge: 'Project',
        ...(coverImagePath ? { coverImagePath, image: coverImagePath } : {}),
        description: entry.frontmatter.seoDescription ?? entry.frontmatter.description ?? '',
        domain: `/portfolio/${entry.slug}/`,
        title: entry.frontmatter.title ?? entry.slug,
        variant: coverImagePath ? 'article' : 'simple'
      }
    },
    output: entry => `portfolio/${entry.slug}.webp`,
    root: ROOT,
    sources: (entry, data) => data.coverImagePath ? [entry.filePath, data.coverImagePath] : [entry.filePath]
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
}

export const collectSpecs = async () => (await collectCards()).map(card => ({
  outFile: path.join(OUT_DIR, card.output),
  props: {
    ...(card.data.coverImagePath ? { coverImagePath: card.data.coverImagePath } : {}),
    description: card.data.description,
    pathLabel: card.data.domain,
    title: card.data.title,
    type: card.data.badge
  }
}))

export default definePresetConfig({
  cards: collectCards,
  clean: true,
  concurrency: 'auto',
  outputDirectory: 'public/og',
  routeManifest: { file: 'public/og/manifest.json', publicPath: '/og' },
  preset: {
    brand: { domain: 'santi020k.com', name: 'Santiago Molina' },
    theme: { accent: '#945df4', background: '#0d0718', panel: '#1c1528' }
  },
  root: ROOT
})
