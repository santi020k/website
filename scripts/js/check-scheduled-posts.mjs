import { appendFileSync } from 'node:fs'
import { glob, readFile } from 'node:fs/promises'
import { basename, dirname, join, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const origin = 'https://santi020k.com'

/**
 * Reads the two frontmatter fields that decide publication. The content schema stays the
 * source of truth during the build; this only answers whether a deployment is due.
 * @param {string} source
 */
export const readPublication = source => {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(source)?.[1] ?? ''
  const date = /^publishDate:\s*["']?([^"'\r\n]+)["']?\s*$/mu.exec(frontmatter)?.[1]
  const publishDate = date ? new Date(date.trim()) : undefined

  return {
    draft: /^draft:\s*true\s*$/mu.test(frontmatter),
    publishDate: publishDate && !Number.isNaN(publishDate.getTime()) ? publishDate : undefined
  }
}

/**
 * Posts the next build would publish that production does not list yet.
 * @param {{ slug: string, draft: boolean, publishDate?: Date }[]} posts
 * @param {Iterable<string>} publishedUrls
 * @param {Date} [now]
 */
export const findUnpublished = (posts, publishedUrls, now = new Date()) => {
  const published = new Set(publishedUrls)

  return posts
    .filter(({ draft, publishDate }) => !draft && publishDate !== undefined && publishDate <= now)
    .map(({ slug }) => `${origin}/blog/${slug}/`)
    .filter(url => !published.has(url))
    .sort()
}

/**
 * @param {string} [root]
 * @returns {Promise<{ slug: string, draft: boolean, publishDate?: Date }[]>}
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

  const due = findUnpublished(await readPosts(), urls)

  console.log(due.length > 0 ? `Due for publication:\n${due.join('\n')}` : 'Every due post is already published.')

  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `deploy=${due.length > 0}\n`)
}
