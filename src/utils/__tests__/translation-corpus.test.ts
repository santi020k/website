import { readFileSync } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'

import { type ContentEntry, readContent } from '@santi020k/og/content'
import { describe, expect, test } from 'vitest'

import { postTranslationSchema, projectTranslationSchema } from '../../content-translations'

const codeBlocks = (body: string) => [...body.matchAll(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gmu)]
  .map(match => match[0])
const headingDepths = (body: string) => {
  const prose = codeBlocks(body).reduce((text, block) => text.replace(block, ''), body)

  return [...prose.matchAll(/^(#{1,6})\s+/gmu)].map(match => match[1]?.length)
}

const translationDiagnostics = (
  original: ContentEntry,
  translation: ContentEntry | undefined,
  collection: 'post' | 'project'
) => {
  if (!translation) return [`${original.filePath}: missing translation`]

  const diagnostics: string[] = []
  const schema = collection === 'post' ? postTranslationSchema : projectTranslationSchema
  const parsed = schema.safeParse(translation.frontmatter)

  if (!parsed.success) {
    diagnostics.push(`${translation.filePath}: ${parsed.error.message}`)
  }

  for (const field of ['cardDescription', 'seoTitle', 'seoDescription', 'coverImage', 'startHere', 'caseStudy', 'previews']) {
    if (original.frontmatter[field] !== undefined && translation.frontmatter[field] === undefined) {
      diagnostics.push(`${translation.filePath}: missing translated ${field}`)
    }
  }

  for (const [sourceField, targetField] of [
    ['impactMetrics', 'impactMetrics'],
    ['focusAreas', 'focusAreas'],
    ['closingLinks', 'closingLinkLabels'],
    ['relatedWriting', 'relatedWritingLabels']
  ] as const) {
    const sourceItems = original.frontmatter[sourceField]
    const targetItems = translation.frontmatter[targetField]

    if (Array.isArray(sourceItems) && (!Array.isArray(targetItems) || targetItems.length !== sourceItems.length)) {
      diagnostics.push(`${translation.filePath}: ${targetField} must contain ${sourceItems.length} translated items`)
    }
  }

  if (translation.body.trim().length <= 100) {
    diagnostics.push(`${translation.filePath}: translated body must contain more than 100 characters`)
  }

  if (translation.body === original.body) {
    diagnostics.push(`${translation.filePath}: translated body is identical to the original`)
  }

  if (!isDeepStrictEqual(codeBlocks(translation.body), codeBlocks(original.body))) {
    diagnostics.push(`${translation.filePath}: code blocks differ from the original`)
  }

  if (!isDeepStrictEqual(headingDepths(translation.body), headingDepths(original.body))) {
    diagnostics.push(`${translation.filePath}: heading structure differs from the original`)
  }

  // Relative image references share the original's assets and must remain readable.
  for (const match of translation.body.matchAll(/!\[[^\]]*\]\((\.\/[^\s)]+)[^)]*\)/gu)) {
    const asset = match[1]

    if (!asset) continue

    try {
      readFileSync(path.resolve(path.dirname(translation.filePath), asset))
    } catch {
      diagnostics.push(`${translation.filePath}: cannot read image ${asset}`)
    }
  }

  return diagnostics
}

for (const collection of ['post', 'project'] as const) {
  describe(`${collection} translation corpus`, () => {
    test('provides full paired bodies without copying publication state or changing code', async () => {
      const entries = await readContent({ directory: `src/content/${collection}`, exclude: ['AGENTS.md'] })
      const translations = new Map(entries
        .filter(entry => /\.es\.mdx?$/u.test(entry.filePath))
        .map(entry => [entry.filePath.replace(/\.es(\.mdx?)$/u, '$1'), entry]))
      const originals = entries.filter(entry => !/\.es\.mdx?$/u.test(entry.filePath) && entry.body.trim())
      const diagnostics = originals.flatMap(original => translationDiagnostics(
        original,
        translations.get(original.filePath),
        collection
      ))

      expect(originals.length).toBeGreaterThan(20)
      expect(translations.size).toBe(originals.length)
      expect(diagnostics).toEqual([])
    })
  })
}
