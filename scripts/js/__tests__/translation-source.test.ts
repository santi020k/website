// @vitest-environment node
import { describe, expect, test } from 'vitest'

import { checkTranslationSource, computeSourceHash, findTranslations, sourcePathFor } from '../translation-source.mjs'

const english = (frontmatter: string, body = 'Body text.\n') => `---\ntitle: "Title"\ndescription: "Description"\n${frontmatter}\n---\n\n${body}`
const owned = ['title', 'description', 'sourceHash']

describe('translation source hashes', () => {
  test('change with the English copy the translation owns', () => {
    const base = computeSourceHash(english('publishDate: "2026-01-01"'), owned)

    expect(base).toMatch(/^[\da-f]{12}$/u)
    expect(computeSourceHash(english('publishDate: "2026-01-01"', 'Body text, edited.\n'), owned)).not.toBe(base)
    expect(computeSourceHash(english('publishDate: "2026-01-01"').replace('"Title"', '"New title"'), owned)).not.toBe(base)
  })

  test('ignore fields the translation does not own and formatting-only whitespace', () => {
    const base = computeSourceHash(english('publishDate: "2026-01-01"\ntags: ["astro"]'), owned)

    expect(computeSourceHash(english('publishDate: "2027-05-05"\ntags: ["css"]'), owned)).toBe(base)
    expect(computeSourceHash(english('publishDate: "2026-01-01"', 'Body text.   \n\n\n\n'), owned)).toBe(base)
  })

  test('every Spanish entry records the English version it matches', async () => {
    const translations = await findTranslations()

    expect(translations.length).toBeGreaterThan(80)
    expect(sourcePathFor('/a/index.es.mdx')).toBe('/a/index.mdx')

    const results = await Promise.all(translations.map(checkTranslationSource))

    expect(results.every(({ recorded }) => recorded !== undefined)).toBe(true)
  })
})
