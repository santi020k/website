/**
 * Pre-build OG image generator.
 *
 * Generates all Open Graph images in parallel and writes them to `public/og/`
 * so Astro can serve them as static passthrough files (zero build-time cost).
 *
 * Run via: `pnpm run generate:og` or automatically as part of `prebuild`.
 *
 * Strategy:
 *  - Reads content frontmatter directly with `js-yaml` (no Astro runtime needed)
 *  - Collects all image specs (pages, posts, projects, series, technologies)
 *  - Renders all images in parallel with `Promise.all()` via CONCURRENCY batches
 *  - Skips images whose output file already exists and is newer than this script
 *    (set FORCE_OG=1 to regenerate everything)
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderSocialImage } from '../../src/utils/render-social-image.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const OUT_DIR = path.join(ROOT, 'public', 'og')
// Maximum number of images rendered simultaneously.
const CONCURRENCY = 8
const FORCE = process.env.FORCE_OG === '1'
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const trimOuterSlashes = value => value.replace(/^\/+|\/+$/g, '')

const safeDecodeURIComponent = value => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const getSocialImageSlug = pathname => trimOuterSlashes(pathname)
  .split('/')
  .filter(Boolean)
  .map(segment => encodeURIComponent(safeDecodeURIComponent(segment)).replaceAll('%', '~'))
  .join('--')

/** Read and parse the YAML frontmatter from a markdown / MDX file. */
const readFrontmatter = filePath => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const content = fs.readFileSync(filePath, 'utf8')
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)

  if (!match) return {}

  return yaml.load(match[1]) ?? {}
}

const isMarkdownFile = fileName => fileName.endsWith('.md') || fileName.endsWith('.mdx')

/** Collect all .md / .mdx files inside `dir`, including nested content dirs. */
export const collectMarkdownFiles = dir => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(dir)) return []

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) return collectMarkdownFiles(entryPath)

    return isMarkdownFile(entry.name) ? [entryPath] : []
  })
}

/** Derive a content id from a markdown path, matching Astro's `index.md` behavior. */
export const getContentSlug = (filePath, baseDir) => {
  const relativePath = path.relative(baseDir, filePath).replaceAll(path.sep, '/')
  const withoutExtension = relativePath.replace(/\.mdx?$/, '')
  const slug = path.posix.basename(withoutExtension) === 'index' ?
    path.posix.dirname(withoutExtension) :
    withoutExtension

  return slug === '.' ? '' : slug
}

/**
 * Resolve a frontmatter image path to an absolute file path.
 * Remote URLs are ignored because the prebuild renderer only handles local assets.
 */
export const resolveContentImagePath = (markdownFilePath, imagePath) => {
  if (typeof imagePath !== 'string' || imagePath.length === 0) return undefined
  if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('data:')) return undefined

  const absolutePath = path.isAbsolute(imagePath) ?
    imagePath :
    path.resolve(path.dirname(markdownFilePath), imagePath)

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.existsSync(absolutePath) ? absolutePath : undefined
}

const getCoverImagePath = (markdownFilePath, frontmatter, { preferOgImage = false } = {}) => {
  const coverImage = frontmatter.coverImage

  if (!coverImage) return undefined

  const candidates = preferOgImage ?
    [coverImage.ogImage, coverImage.src] :
    [coverImage.src]

  return candidates
    .map(candidate => resolveContentImagePath(markdownFilePath, candidate))
    .find(Boolean)
}
// ---------------------------------------------------------------------------
// Collect image specs
// ---------------------------------------------------------------------------
const yearsOfExperience = `${new Date().getFullYear() - 2014}+`

/** Static page definitions (mirrors `src/data/social-pages.ts`). */
const staticSocialPages = [
  {
    description:
      `${yearsOfExperience} years shipping full-stack products. ` +
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
    description: 'A curated showcase of professional engineering projects, open-source contributions, and technical experiments across headless commerce, gaming, and SaaS.',
    pathname: '/portfolio/',
    title: 'Engineering Portfolio - Santiago Molina',
    type: 'Portfolio'
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
    description:
      'A practical look at the tools, workflow defaults, and setup principles Santiago Molina uses for engineering leadership, architecture, writing, and delivery.',
    pathname: '/uses/',
    title: 'Uses & Workflow',
    type: 'Workflow'
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

export const collectSpecs = () => {
  /** @type {Array<{outFile: string, props: object}>} */
  const specs = []

  // Static pages
  for (const page of staticSocialPages) {
    specs.push({
      outFile: path.join(OUT_DIR, 'pages', `${getSocialImageSlug(page.pathname)}.webp`),
      props: {
        description: page.description,
        pathLabel: page.pathname,
        title: page.title,
        type: page.type
      }
    })
  }

  // Blog posts
  const postDir = path.join(ROOT, 'src', 'content', 'post')

  for (const filePath of collectMarkdownFiles(postDir)) {
    const fm = readFrontmatter(filePath)

    if (fm.draft && process.env.NODE_ENV === 'production') continue

    const id = getContentSlug(filePath, postDir)
    const coverImagePath = getCoverImagePath(filePath, fm)

    specs.push({
      outFile: path.join(OUT_DIR, 'blog', `${id}.webp`),
      props: {
        ...(coverImagePath ? { coverImagePath } : {}),
        description: fm.description ?? '',
        pathLabel: `/blog/${id}/`,
        title: fm.title ?? id,
        type: 'Blog Post'
      }
    })
  }

  // Projects
  const projectDir = path.join(ROOT, 'src', 'content', 'project')

  for (const filePath of collectMarkdownFiles(projectDir)) {
    const fm = readFrontmatter(filePath)

    if (fm.draft && process.env.NODE_ENV === 'production') continue

    const id = getContentSlug(filePath, projectDir)
    const coverImagePath = getCoverImagePath(filePath, fm, { preferOgImage: true })

    specs.push({
      outFile: path.join(OUT_DIR, 'portfolio', `${id}.webp`),
      props: {
        ...(coverImagePath ? { coverImagePath } : {}),
        description: fm.seoDescription ?? fm.description ?? '',
        pathLabel: `/portfolio/${id}/`,
        title: fm.title ?? id,
        type: 'Project'
      }
    })
  }

  // Series
  const seriesDir = path.join(ROOT, 'src', 'content', 'series')

  for (const filePath of collectMarkdownFiles(seriesDir)) {
    const fm = readFrontmatter(filePath)
    const id = getContentSlug(filePath, seriesDir)
    const seriesPathname = `/blog/series/${id}/`
    const slug = getSocialImageSlug(seriesPathname)

    specs.push({
      outFile: path.join(OUT_DIR, 'pages', `${slug}.webp`),
      props: {
        description: fm.seoDescription ?? fm.description ?? '',
        pathLabel: seriesPathname,
        title: fm.seoTitle ?? fm.title ?? id,
        type: 'Blog Series'
      }
    })
  }

  // Technologies — derived from project frontmatter
  const allTechnologies = new Set()
  const projectFiles = collectMarkdownFiles(projectDir)

  for (const filePath of projectFiles) {
    const fm = readFrontmatter(filePath)

    if (fm.draft && process.env.NODE_ENV === 'production') continue

    if (Array.isArray(fm.technologies)) {
      for (const tech of fm.technologies) allTechnologies.add(tech)
    }
  }

  for (const tech of allTechnologies) {
    const pathname = `/technologies/${encodeURIComponent(tech)}/`
    const slug = getSocialImageSlug(pathname)

    specs.push({
      outFile: path.join(OUT_DIR, 'pages', `${slug}.webp`),
      props: {
        description:
          `Projects and case studies where ${tech} shaped the architecture, ` +
          'delivery workflow, or product experience.',
        pathLabel: pathname,
        title: `${tech} · Technology`,
        type: 'Technology'
      }
    })
  }

  return specs
}

// ---------------------------------------------------------------------------
// Parallel generation with concurrency limit
// ---------------------------------------------------------------------------

/**
 * Runs `tasks` with at most `limit` concurrent executions.
 * @template T
 * @param {Array<() => Promise<T>>} tasks
 * @param {number} limit
 * @returns {Promise<T[]>}
 */
const pLimit = async (tasks, limit) => {
  const results = []
  let idx = 0

  const worker = async () => {
    while (idx < tasks.length) {
      const i = idx++

      // eslint-disable-next-line security/detect-object-injection
      results[i] = await tasks[i]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))

  return results
}

const generate = async ({ outFile, props }) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!FORCE && fs.existsSync(outFile)) {
    process.stdout.write(`  skip  ${path.relative(ROOT, outFile)}\n`)

    return
  }

  const buffer = await renderSocialImage(props)

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.mkdirSync(path.dirname(outFile), { recursive: true })

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(outFile, buffer)

  process.stdout.write(`  write ${path.relative(ROOT, outFile)}\n`)
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export const generateAll = async () => {
  const start = performance.now()
  const specs = collectSpecs()

  console.log(`\n🖼  Generating ${specs.length} OG images (concurrency=${CONCURRENCY})…\n`)

  const tasks = specs.map(spec => () => generate(spec))

  await pLimit(tasks, CONCURRENCY)

  const elapsed = ((performance.now() - start) / 1000).toFixed(2)

  console.log(`\n✅ Done in ${elapsed}s\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateAll()
}
