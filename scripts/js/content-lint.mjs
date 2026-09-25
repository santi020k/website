import fs from 'node:fs/promises'
import path from 'node:path'

import { load as loadYaml } from 'js-yaml'
import sharp from 'sharp'

const CONTENT_ROOT = path.resolve('src/content')
const POST_ROOT = path.resolve(CONTENT_ROOT, 'post')
const SERIES_ROOT = path.resolve(CONTENT_ROOT, 'series')
const POST_COVER_HEIGHT = 900
const POST_COVER_WIDTH = 1600
const isContentFile = filePath => filePath.endsWith('.md') || filePath.endsWith('.mdx')

/**
 * Mirrors the collection id that `glob()` derives for a content file: the path
 * relative to the collection base, without extension and without `/index`.
 */
const collectionId = (root, filePath) => path
  .relative(root, filePath)
  .split(path.sep)
  .join('/')
  .replace(/\.mdx?$/, '')
  .replace(/\/index$/, '')

const walkFiles = async directory => {
  const entries = await fs.readdir(directory, { withFileTypes: true })

  const files = await Promise.all(entries.map(async entry => {
    const resolved = path.join(directory, entry.name)

    if (entry.isDirectory()) return walkFiles(resolved)

    return resolved
  }))

  return files.flat()
}

const parseFrontmatter = raw => {
  if (!raw.startsWith('---\n')) return null

  const end = raw.indexOf('\n---\n', 4)

  if (end === -1) return null

  return loadYaml(raw.slice(4, end))
}

const validatePostCover = async (filePath, coverImage) => {
  if (!filePath.startsWith(`${POST_ROOT}${path.sep}`)) return []

  if (!coverImage || typeof coverImage !== 'object') {
    return [`${filePath}: posts must provide coverImage`]
  }

  const source = String(coverImage.src ?? '')

  if (source !== './cover.webp') {
    return [`${filePath}: post coverImage.src must be ./cover.webp`]
  }

  const coverPath = path.resolve(path.dirname(filePath), source)

  try {
    const metadata = await sharp(coverPath).metadata()

    if (metadata.format !== 'webp') {
      return [`${filePath}: post cover must use WebP format`]
    }

    if (metadata.width !== POST_COVER_WIDTH || metadata.height !== POST_COVER_HEIGHT) {
      return [
        `${filePath}: post cover must be ${POST_COVER_WIDTH}x${POST_COVER_HEIGHT}; ` +
        `received ${metadata.width ?? 'unknown'}x${metadata.height ?? 'unknown'}`
      ]
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return [`${filePath}: unable to inspect post cover: ${message}`]
  }

  return []
}

const validateFile = async filePath => {
  if (path.basename(filePath) === 'AGENTS.md') return { errors: [] }

  if (!isContentFile(filePath)) return { errors: [] }

  const raw = await fs.readFile(filePath, 'utf8')
  const frontmatter = parseFrontmatter(raw)

  if (!frontmatter || typeof frontmatter !== 'object') {
    return { errors: [`${filePath}: missing or invalid frontmatter`] }
  }

  const errors = []
  const title = String(frontmatter.title ?? '')
  const description = String(frontmatter.description ?? '')
  const canonicalUrl = frontmatter.canonicalUrl
  const coverImage = frontmatter.coverImage

  if (title.length < 3 || title.length > 100) {
    errors.push(`${filePath}: title must be between 3 and 100 characters`)
  }

  if (description.length < 20 || description.length > 320) {
    errors.push(`${filePath}: description must be between 20 and 320 characters`)
  }

  if (canonicalUrl && !String(canonicalUrl).startsWith('https://')) {
    errors.push(`${filePath}: canonicalUrl must be an absolute https URL`)
  }

  if (coverImage && typeof coverImage === 'object') {
    const alt = String(coverImage.alt ?? '')

    if (alt.length < 12) {
      errors.push(`${filePath}: coverImage.alt must be at least 12 characters`)
    }
  }

  errors.push(...await validatePostCover(filePath, coverImage))

  const isPost = filePath.startsWith(`${POST_ROOT}${path.sep}`)

  const seriesMembership = isPost && typeof frontmatter.seriesId === 'string' ?
    {
      filePath,
      seriesId: frontmatter.seriesId,
      seriesOrder: frontmatter.seriesOrder
    } :
    undefined

  return { errors, ...(seriesMembership ? { seriesMembership } : {}) }
}

/** Collects the ids declared by the `series` collection. */
const readSeriesIds = async () => {
  const files = await walkFiles(SERIES_ROOT)

  return new Set(files.filter(isContentFile).map(file => collectionId(SERIES_ROOT, file)))
}

/**
 * Cross-file checks for series membership. A `seriesId` that does not resolve to
 * a real series silently drops the post out of its reading track, and duplicate
 * `seriesOrder` values make that track's order depend on tie-breaking instead of
 * intent — neither is visible from a single file, so the schema cannot catch them.
 */
const validateSeriesMembership = (memberships, seriesIds) => {
  const errors = []
  const ordersBySeries = new Map()

  for (const { filePath, seriesId, seriesOrder } of memberships) {
    if (!seriesIds.has(seriesId)) {
      errors.push(
        `${filePath}: seriesId "${seriesId}" does not match any entry in src/content/series ` +
        `(known: ${[...seriesIds].sort().join(', ') || 'none'})`
      )

      continue
    }

    if (typeof seriesOrder !== 'number') continue

    const seen = ordersBySeries.get(seriesId) ?? new Map()
    const previous = seen.get(seriesOrder)

    if (previous) {
      errors.push(
        `${filePath}: seriesOrder ${seriesOrder} in series "${seriesId}" is already used by ${previous}`
      )
    } else {
      seen.set(seriesOrder, filePath)
    }

    ordersBySeries.set(seriesId, seen)
  }

  return errors
}

const run = async () => {
  const [files, seriesIds] = await Promise.all([walkFiles(CONTENT_ROOT), readSeriesIds()])
  const results = await Promise.all(files.map(validateFile))

  const errors = [
    ...results.flatMap(result => result.errors),
    ...validateSeriesMembership(
      results.flatMap(result => (result.seriesMembership ? [result.seriesMembership] : [])),
      seriesIds
    )
  ]

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error)
    }

    throw new Error('Content lint checks failed')
  }

  console.log(`Content lint passed for ${files.length} files.`)
}

await run()
