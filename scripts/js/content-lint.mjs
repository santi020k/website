import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import { travelNotesSchema } from '../../src/data/travel-notes-schema.ts'

import { contentId, findMarkdownFiles, isFrontmatter, parseFrontmatter } from './utils/frontmatter.mjs'
import { checkTranslationSource } from './translation-source.mjs'

const CONTENT_ROOT = path.resolve('src/content')
const COUNTRY_ROOT = path.resolve(CONTENT_ROOT, 'country')
const POST_ROOT = path.resolve(CONTENT_ROOT, 'post')
const SERIES_ROOT = path.resolve(CONTENT_ROOT, 'series')
const POST_COVER_HEIGHT = 900
const POST_COVER_WIDTH = 1600
/** Matches the shared placeholder cover's alt text in English and Spanish. */
const PLACEHOLDER_COVER = /^(?:Placeholder cover|Portada provisional)\b/u
/** @param {string} filePath */
const isContentFile = filePath => filePath.endsWith('.md') || filePath.endsWith('.mdx')

/** @param {string} filePath @param {unknown} coverImage */
const validatePostCover = async (filePath, coverImage) => {
  if (!filePath.startsWith(`${POST_ROOT}${path.sep}`)) return []

  if (!isFrontmatter(coverImage)) {
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

/** Translations inherit publication from the English entry beside them.
 * @param {string} filePath
 * @param {import('./utils/frontmatter.mjs').Frontmatter} frontmatter
 */
const isDraft = async (filePath, frontmatter) => {
  const match = /\.es(\.mdx?)$/u.exec(filePath)

  if (!match) return frontmatter.draft === true

  const source = filePath.replace(/\.es(\.mdx?)$/u, '$1')
  const original = parseFrontmatter(await fs.readFile(source, 'utf8').catch(() => ''))?.frontmatter

  return original?.draft === true
}

/**
 * @typedef {{ filePath: string, seriesId: string, seriesOrder: unknown }} SeriesMembership
 * @typedef {{ errors: string[], warnings?: string[], seriesMembership?: SeriesMembership }} ValidationResult
 */

/** @param {string} filePath @returns {Promise<ValidationResult>} */
const validateFile = async filePath => {
  if (path.basename(filePath) === 'AGENTS.md') return { errors: [] }

  if (!isContentFile(filePath)) return { errors: [] }

  const raw = await fs.readFile(filePath, 'utf8')
  let parsed

  try {
    parsed = parseFrontmatter(raw)
  } catch {
    parsed = undefined
  }

  if (!parsed) {
    return { errors: [`${filePath}: missing or invalid frontmatter`] }
  }

  const { frontmatter } = parsed

  if (filePath.startsWith(`${COUNTRY_ROOT}${path.sep}`)) {
    const result = travelNotesSchema.safeParse(frontmatter)

    return {
      errors: result.success ? [] : result.error.issues.map(issue => `${filePath}: ${issue.path.join('.')}: ${issue.message}`)
    }
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

  if (isFrontmatter(coverImage)) {
    const alt = String(coverImage.alt ?? '')

    if (alt.length < 12) {
      errors.push(`${filePath}: coverImage.alt must be at least 12 characters`)
    }

    // Scheduled posts publish without anyone watching, so the placeholder art must be gone first.
    if (PLACEHOLDER_COVER.test(alt) && !await isDraft(filePath, frontmatter)) {
      errors.push(`${filePath}: replace the placeholder cover (and its alt text) before removing draft: true`)
    }
  }

  const body = parsed.body
  const titleOnlyDraft = frontmatter.draft === true && body.length === 0 && coverImage === undefined

  if (!titleOnlyDraft && !/\.es\.mdx?$/u.test(filePath)) errors.push(...await validatePostCover(filePath, coverImage))

  const warnings = []

  if (/\.es\.mdx?$/u.test(filePath)) {
    const { expected, recorded } = await checkTranslationSource(filePath)

    if (recorded === undefined) {
      errors.push(`${filePath}: missing sourceHash; run pnpm run translations:stamp -- ${path.relative(process.cwd(), filePath)}`)
    } else if (recorded !== expected) {
      warnings.push(
        `${path.relative(process.cwd(), filePath)}: the English entry changed after this translation ` +
        `(sourceHash ${recorded}, now ${expected}). Update the Spanish copy, then run ` +
        `pnpm run translations:stamp -- ${path.relative(process.cwd(), filePath)}`
      )
    }
  }

  const isPost = filePath.startsWith(`${POST_ROOT}${path.sep}`)

  const seriesMembership = isPost && typeof frontmatter.seriesId === 'string' ?
    {
      filePath,
      seriesId: frontmatter.seriesId,
      seriesOrder: frontmatter.seriesOrder
    } :
    undefined

  return { errors, warnings, ...(seriesMembership ? { seriesMembership } : {}) }
}

/** Collects the ids declared by the `series` collection. */
const readSeriesIds = async () => {
  const files = await findMarkdownFiles(SERIES_ROOT)

  return new Set(files.filter(isContentFile).map(file => contentId(SERIES_ROOT, file)))
}

/**
 * Cross-file checks for series membership. A `seriesId` that does not resolve to
 * a real series silently drops the post out of its reading track, and duplicate
 * `seriesOrder` values make that track's order depend on tie-breaking instead of
 * intent — neither is visible from a single file, so the schema cannot catch them.
 * @param {SeriesMembership[]} memberships
 * @param {Set<string>} seriesIds
 */
const validateSeriesMembership = (memberships, seriesIds) => {
  const errors = []
  /** @type {Map<string, Map<number, string>>} */
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
  const [files, seriesIds] = await Promise.all([findMarkdownFiles(CONTENT_ROOT), readSeriesIds()])
  const results = await Promise.all(files.map(validateFile))

  const errors = [
    ...results.flatMap(result => result.errors),
    ...validateSeriesMembership(
      results.flatMap(result => (result.seriesMembership ? [result.seriesMembership] : [])),
      seriesIds
    )
  ]

  const warnings = results.flatMap(result => result.warnings ?? [])

  // Drift is reported, not fatal: an English typo fix should not block a release.
  for (const warning of warnings) console.warn(`warning: ${warning}`)

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error)
    }

    throw new Error('Content lint checks failed')
  }

  console.log(`Content lint passed for ${files.length} files${warnings.length > 0 ? ` with ${warnings.length} translation(s) behind their English source` : ''}.`)
}

await run()
