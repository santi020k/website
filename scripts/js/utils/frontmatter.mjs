import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { load as loadYaml } from 'js-yaml'

/**
 * One frontmatter reader for build scripts and `astro.config.ts`. The content schema in
 * `src/content.config.ts` stays the source of truth for the site itself; this only lets
 * tooling read the same files without starting Astro.
 *
 * Scheduled publishing uses this reader too, so valid YAML has the same meaning in
 * publication checks and content builds.
 */

/** Opening fence, YAML, closing fence and the line break after it. */
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/u

/** @typedef {Record<string, unknown>} Frontmatter */

/**
 * @typedef {object} ContentFile
 * @property {string} filePath Absolute path.
 * @property {string} id Path from the collection root without extension or trailing `/index`, using `/`.
 * @property {boolean} isTranslation Whether the file is an `index.es.md(x)` translation.
 * @property {Frontmatter} frontmatter
 * @property {string} body Markdown after the frontmatter, trimmed.
 */

/**
 * @param {unknown} value
 * @returns {value is Frontmatter}
 */
export const isFrontmatter = value => typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Splits a Markdown source into its frontmatter and body.
 * @param {string} source
 * @returns {{ frontmatter: Frontmatter, body: string } | undefined} `undefined` when there is no frontmatter block.
 * @throws {TypeError} When the YAML is not a mapping.
 */
export const parseFrontmatter = source => {
  const match = frontmatterPattern.exec(source)

  if (!match) return undefined

  const data = loadYaml(match[1] ?? '')

  if (!isFrontmatter(data)) throw new TypeError('Frontmatter must be a YAML mapping')

  return { frontmatter: data, body: source.slice(match[0].length).trim() }
}

/**
 * Every `.md` and `.mdx` file below a directory, sorted for stable output.
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
export const findMarkdownFiles = async directory => {
  /** @type {import('node:fs').Dirent[]} */
  let entries

  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch {
    return []
  }

  const nested = await Promise.all(entries.map(async entry => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) return findMarkdownFiles(entryPath)

    return entry.isFile() && /\.mdx?$/u.test(entry.name) ? [entryPath] : []
  }))

  return nested.flat().sort()
}

/**
 * Collection id as Astro's glob loader derives it, minus `/index`.
 * @param {string} root
 * @param {string} filePath
 */
export const contentId = (root, filePath) => path
  .relative(root, filePath)
  .split(path.sep)
  .join('/')
  .replace(/\.mdx?$/u, '')
  .replace(/\/index$/u, '')

/**
 * Reads and parses every Markdown file in a collection directory. Files without
 * frontmatter are skipped; `AGENTS.md` notes are never content.
 * @param {string} directory
 * @param {{ translations?: boolean }} [options] Include `.es` translations (default `false`).
 * @returns {Promise<ContentFile[]>}
 */
export const readContentFiles = async (directory, { translations = false } = {}) => {
  const files = (await findMarkdownFiles(directory)).filter(file => path.basename(file) !== 'AGENTS.md')

  const entries = await Promise.all(files.map(async filePath => {
    const isTranslation = /\.es\.mdx?$/u.test(filePath)

    if (isTranslation && !translations) return []

    const parsed = parseFrontmatter(await readFile(filePath, 'utf8'))

    if (!parsed) return []

    return [{ filePath, id: contentId(directory, filePath.replace(/\.es(\.mdx?)$/u, '$1')), isTranslation, ...parsed }]
  }))

  return entries.flat()
}
