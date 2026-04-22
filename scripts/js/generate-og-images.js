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

import yaml from 'js-yaml'
import fs, { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const OUT_DIR = path.join(ROOT, 'public', 'og')
const WORKER_SCRIPT = new URL('./og-render-worker.mjs', import.meta.url)
const FORCE = process.env.FORCE_OG === '1'

/** @returns {number} Positive worker count before clamping to job count. */
const getConfiguredWorkerThreads = () => {
  const raw = process.env.OG_WORKER_THREADS

  if (raw !== undefined && raw !== '') {
    const n = Number.parseInt(raw, 10)

    if (Number.isFinite(n) && n > 0) return Math.min(n, 32)
  }

  // Use more cores by default on modern laptops/desktops; users can still cap via OG_WORKER_THREADS.
  return Math.min(16, os.availableParallelism())
}

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

    const rawId = getContentSlug(filePath, postDir)
    const id = rawId.includes('/') ? rawId.split('/').pop() : rawId
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

  // Projects + technologies (single pass to avoid parsing frontmatter twice)
  const projectDir = path.join(ROOT, 'src', 'content', 'project')
  const allTechnologies = new Set()
  const projectFiles = collectMarkdownFiles(projectDir)

  for (const filePath of projectFiles) {
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

    if (Array.isArray(fm.technologies)) {
      for (const tech of fm.technologies) allTechnologies.add(tech)
    }
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
// Worker pool (one Satori/Resvg pipeline per thread)
// ---------------------------------------------------------------------------

class OgRenderPool {
  /** @param {number} workerCount */
  constructor(workerCount) {
    this.workerCount = workerCount

    /** @type {Worker[]} */
    this.workers = []

    /** @type {Worker[]} */
    this.available = []

    /** @type {Array<{ props: object, resolve: (b: Buffer) => void, reject: (e: Error) => void }>} */
    this.waiting = []

    /** @type {Map<number, { resolve: (b: Buffer) => void, reject: (e: Error) => void, worker: Worker }>} */
    this.inFlight = new Map()

    this.nextId = 1
  }

  async start() {
    for (let i = 0; i < this.workerCount; i++) {
      const w = new Worker(WORKER_SCRIPT, { type: 'module' })

      w.on('message', msg => this.onMessage(w, msg))

      w.on('error', err => this.onWorkerError(w, err))

      this.workers.push(w)

      this.available.push(w)
    }
  }

  /**
   * @param {Worker} worker
   * @param {{ id: number, ok: true, buffer: ArrayBuffer } | { id: number, ok: false, message?: string }} msg
   */
  onMessage(worker, msg) {
    const entry = this.inFlight.get(msg.id)

    if (!entry) return

    this.inFlight.delete(msg.id)

    this.available.push(worker)

    if (msg.ok) {
      entry.resolve(Buffer.from(msg.buffer))
    } else {
      entry.reject(new Error(msg.message ?? 'OG worker render failed'))
    }

    this.pump()
  }

  /** @param {Worker} worker */
  onWorkerError(worker, err) {
    const idx = this.workers.indexOf(worker)

    if (idx !== -1) this.workers.splice(idx, 1)

    for (const [id, entry] of this.inFlight) {
      if (entry.worker === worker) {
        this.inFlight.delete(id)

        entry.reject(err instanceof Error ? err : new Error(String(err)))

        break
      }
    }

    this.pump()
  }

  pump() {
    while (this.waiting.length > 0 && this.available.length > 0) {
      const job = this.waiting.shift()
      const worker = this.available.pop()
      const id = this.nextId++

      if (!job || !worker) break

      this.inFlight.set(id, {
        resolve: job.resolve,
        reject: job.reject,
        worker
      })

      worker.postMessage({ id, props: job.props })
    }
  }

  /** @param {object} props */
  render(props) {
    return new Promise((resolve, reject) => {
      this.waiting.push({ props, resolve, reject })

      this.pump()
    })
  }

  async shutdown() {
    await Promise.all(this.workers.map(w => w.terminate()))

    this.workers = []

    this.available = []
  }
}

/**
 * @param {OgRenderPool | null} pool
 * @param {{ outFile: string, props: object }} spec
 */
const generateOne = async (pool, { outFile, props }) => {
  if (!pool) throw new Error('OG render pool is not initialized')

  const buffer = await pool.render(props)

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fsp.mkdir(path.dirname(outFile), { recursive: true })

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fsp.writeFile(outFile, buffer)

  process.stdout.write(`  write ${path.relative(ROOT, outFile)}\n`)
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export const generateAll = async () => {
  const start = performance.now()
  const specs = collectSpecs()

  const pendingSpecs = FORCE ?
    specs :
    specs.filter(s => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return !fs.existsSync(s.outFile)
    })

  const configured = getConfiguredWorkerThreads()
  const pendingCount = pendingSpecs.length
  const poolSize = pendingCount === 0 ? 0 : Math.min(configured, pendingCount)

  /** @type {OgRenderPool | null} */
  let pool = null

  try {
    if (poolSize > 0) {
      pool = new OgRenderPool(poolSize)

      await pool.start()
    }

    console.log(
      `\n🖼  Generating ${pendingCount}/${specs.length} OG images (workers=${poolSize}, ` +
      `OG_WORKER_THREADS=${process.env.OG_WORKER_THREADS ?? 'default'})…\n`
    )

    if (pendingCount > 0) {
      await Promise.all(pendingSpecs.map(spec => generateOne(pool, spec)))
    }
  } finally {
    if (pool) await pool.shutdown()
  }

  const elapsed = ((performance.now() - start) / 1000).toFixed(2)

  console.log(`\n✅ Done in ${elapsed}s\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateAll()
}
