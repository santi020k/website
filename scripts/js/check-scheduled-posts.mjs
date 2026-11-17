import { appendFileSync } from 'node:fs'
import { glob, readFile } from 'node:fs/promises'
import { basename, dirname, join, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseContentDate } from '../../src/utils/content-date.ts'

import { parseFrontmatter } from './utils/frontmatter.mjs'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const origin = 'https://santi020k.com'

/**
 * Draft posts carry a shared placeholder cover until their artwork is ready. Its alt text,
 * in either language, marks it; content lint rejects it on any post that is not a draft.
 */
export const PLACEHOLDER_COVER_ALT = /^\s*alt:\s*["']?(?:Placeholder cover|Portada provisional)\b/mu

/**
 * Reads the frontmatter fields that decide publication. The content schema stays the
 * source of truth during the build; this only answers whether a deployment is due.
 * @param {string} source
 */
export const readPublication = source => {
  const fields = parseFrontmatter(source)?.frontmatter
  const date = fields?.publishDate
  const publishDate = typeof date === 'string' || date instanceof Date ? parseContentDate(date) : undefined
  const cover = fields?.coverImage
  const alt = cover && typeof cover === 'object' && 'alt' in cover ? cover.alt : undefined

  return {
    draft: fields?.draft === true,
    placeholderCover: typeof alt === 'string' && PLACEHOLDER_COVER_ALT.test(`alt: ${alt}`),
    publishDate: publishDate && !Number.isNaN(publishDate.getTime()) ? publishDate : undefined
  }
}

/** @typedef {{ slug: string, draft: boolean, placeholderCover?: boolean, publishDate?: Date | undefined }} ScheduledPost */

/**
 * Due posts that production does not list yet, split by whether they are ready. A post still
 * on the placeholder cover is held back: lint should have caught it, so it is reported instead.
 * @param {ScheduledPost[]} posts
 * @param {Iterable<string>} publishedUrls
 * @param {Date} [now]
 */
export const classifyDuePosts = (posts, publishedUrls, now = new Date()) => {
  const published = new Set(publishedUrls)

  const due = posts
    .filter(({ draft, publishDate }) => !draft && publishDate !== undefined && publishDate <= now)
    .filter(({ slug }) => !published.has(`${origin}/blog/${slug}/`))

  /** @param {ScheduledPost[]} list */
  const toUrls = list => list.map(({ slug }) => `${origin}/blog/${slug}/`).sort()

  return {
    blocked: toUrls(due.filter(({ placeholderCover }) => placeholderCover === true)),
    ready: toUrls(due.filter(({ placeholderCover }) => placeholderCover !== true))
  }
}

/**
 * Posts the next build would publish that production does not list yet.
 * @param {ScheduledPost[]} posts
 * @param {Iterable<string>} publishedUrls
 * @param {Date} [now]
 */
export const findUnpublished = (posts, publishedUrls, now = new Date()) => {
  const { ready } = classifyDuePosts(posts, publishedUrls, now)

  return ready
}

/**
 * @param {string} [root]
 * @returns {Promise<ScheduledPost[]>}
 */
export const readPosts = async (root = projectRoot) => {
  const directory = join(root, 'src/content/post')

  const files = (await Array.fromAsync(glob('**/index.{md,mdx}', { cwd: directory })))
    .map(file => file.split(sep).join('/'))
    .sort()

  return Promise.all(files.map(async file => ({
    slug: basename(dirname(file)),
    ...readPublication(await readFile(join(directory, file), 'utf8'))
  })))
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const response = await fetch(`${origin}/feed.json`, { signal: AbortSignal.timeout(15_000) })

  if (!response.ok) throw new Error(`${origin}/feed.json responded with ${response.status}.`)

  /** @type {{ items?: { url?: string }[] }} */
  const feed = await response.json()
  const urls = (feed.items ?? []).flatMap(({ url }) => (url ? [url] : []))

  // An empty feed means the request reached something other than the site; never deploy on that.
  if (urls.length === 0) throw new Error(`${origin}/feed.json lists no posts.`)

  const { blocked, ready: due } = classifyDuePosts(await readPosts(), urls)

  console.log(due.length > 0 ? `Due for publication:\n${due.join('\n')}` : 'Every due post is already published.')

  for (const url of blocked) console.log(`::warning::${url} is due but still uses the placeholder cover; it was not deployed.`)

  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `deploy=${due.length > 0}\nurls=${due.join(' ')}\n`)
}
