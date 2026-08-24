import fs from 'node:fs/promises'
import path from 'node:path'

import { load as loadYaml } from 'js-yaml'

const CONTENT_ROOT = path.resolve('src/content')

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

const validateFile = async filePath => {
  if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) return []

  const raw = await fs.readFile(filePath, 'utf8')
  const frontmatter = parseFrontmatter(raw)

  if (!frontmatter || typeof frontmatter !== 'object') {
    return [`${filePath}: missing or invalid frontmatter`]
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

  return errors
}

const run = async () => {
  const files = await walkFiles(CONTENT_ROOT)
  const errors = (await Promise.all(files.map(validateFile))).flat()

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error)
    }

    throw new Error('Content lint checks failed')
  }

  console.log(`Content lint passed for ${files.length} files.`)
}

await run()
