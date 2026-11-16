import { createHash } from 'node:crypto'
import { glob, readFile, writeFile } from 'node:fs/promises'
import { join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isFrontmatter, parseFrontmatter } from './utils/frontmatter.mjs'

/**
 * Spanish translations record which version of the English entry they were written from.
 * `sourceHash` covers the English body and the English values of every field the
 * translation translates, so a change to dates, tags, or assets does not count as drift.
 *
 * Usage:
 *   pnpm run translations:stamp -- src/content/post/2026/slug/index.es.md   # after updating it
 *   pnpm run translations:stamp -- --all                                    # baseline every file
 */

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/u
const TRANSLATION = /\.es(\.mdx?)$/u

/** @param {string} raw */
export const splitFrontmatter = raw => {
  const match = FRONTMATTER.exec(raw)

  if (!match) return undefined

  const parsed = parseFrontmatter(raw)

  if (!parsed) return undefined

  return {
    body: raw.slice(match[0].length),
    data: parsed.frontmatter,
    raw: match[1] ?? ''
  }
}

/** @param {string} translationPath */
export const sourcePathFor = translationPath => translationPath.replace(TRANSLATION, '$1')

/** @param {unknown} value @param {string[]} fields */
const copyFields = (value, fields) => isFrontmatter(value) ?
  Object.fromEntries(fields.map(field => [field, value[field] ?? null])) :
  null

/** Match the copy-only projection used by the translation schemas and merge helpers.
 * @param {import('./utils/frontmatter.mjs').Frontmatter} data
 * @param {string} field
 * @returns {unknown}
 */
const sourceCopy = (data, field) => {
  if (field === 'closingLinkLabels' || field === 'relatedWritingLabels') {
    const links = data[field === 'closingLinkLabels' ? 'closingLinks' : 'relatedWriting']

    return Array.isArray(links) ? links.map(link => isFrontmatter(link) ? link.label ?? null : null) : null
  }

  if (field === 'coverImage') return copyFields(data.coverImage, ['alt'])

  if (field === 'startHere') return copyFields(data.startHere, ['label', 'reason'])

  if (field === 'previews' && isFrontmatter(data.previews)) {
    const { images } = data.previews

    return {
      ...copyFields(data.previews, ['description', 'linkLabel']),
      images: Array.isArray(images) ? images.map(image => copyFields(image, ['alt', 'title', 'caption'])) : null
    }
  }

  return data[field] ?? null
}

/**
 * @param {string} englishRaw The English entry's file contents.
 * @param {Iterable<string>} fields Frontmatter fields the translation owns.
 */
export const computeSourceHash = (englishRaw, fields) => {
  const english = splitFrontmatter(englishRaw)

  if (!english) throw new Error('English entry has no frontmatter.')

  const owned = Object.fromEntries([...new Set(fields)]
    .filter(field => field !== 'sourceHash')
    .sort()
    .map(field => [field, sourceCopy(english.data, field)]))

  // Trailing spaces and blank-line runs are formatting, not content.
  const body = english.body.replace(/[\t ]+$/gmu, '').replace(/\n{3,}/gu, '\n\n').trim()

  return createHash('sha256').update(JSON.stringify(owned)).update('\0').update(body).digest('hex').slice(0, 12)
}

/**
 * Compares a translation with the English entry beside it.
 * @param {string} translationPath
 * @returns {Promise<{ expected: string, recorded?: string }>}
 */
export const checkTranslationSource = async translationPath => {
  const translation = splitFrontmatter(await readFile(translationPath, 'utf8'))

  if (!translation) throw new Error(`${translationPath}: missing frontmatter`)

  const expected = computeSourceHash(await readFile(sourcePathFor(translationPath), 'utf8'), Object.keys(translation.data))
  const recorded = typeof translation.data.sourceHash === 'string' ? translation.data.sourceHash : undefined

  return { expected, ...recorded === undefined ? {} : { recorded } }
}

/**
 * Writes the current English hash into a translation's frontmatter, replacing an old one.
 * @param {string} translationPath
 */
export const stampTranslation = async translationPath => {
  const raw = await readFile(translationPath, 'utf8')
  const parsed = splitFrontmatter(raw)

  if (!parsed) throw new Error(`${translationPath}: missing frontmatter`)

  const { expected, recorded } = await checkTranslationSource(translationPath)

  if (recorded === expected) return false

  const lines = parsed.raw.split(/\r?\n/u).filter(line => !/^sourceHash:/u.test(line))
  const frontmatter = [...lines, `sourceHash: "${expected}"`].join('\n')

  await writeFile(translationPath, raw.replace(parsed.raw, () => frontmatter))

  return true
}

/**
 * @param {string} [root]
 * @returns {Promise<string[]>}
 */
export const findTranslations = async (root = projectRoot) => {
  const files = await Array.fromAsync(glob('src/content/{post,project}/**/index.es.{md,mdx}', { cwd: root }))

  return files.map(file => join(root, file)).sort()
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter(arg => arg !== '--')
  const targets = args.includes('--all') ? await findTranslations() : args.map(arg => resolvePath(arg))

  if (targets.length === 0) {
    console.error('Pass the translation files to stamp, or --all.')

    process.exit(1)
  }

  let changed = 0

  for (const target of targets) {
    if (!TRANSLATION.test(target)) throw new Error(`${target} is not an index.es.md or index.es.mdx file.`)

    if (await stampTranslation(target)) changed += 1
  }

  console.log(`Stamped ${changed} of ${targets.length} translation(s).`)
}
