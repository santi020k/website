import { existsSync } from 'node:fs'
import path from 'node:path'

import { type ContentEntry, readContent } from '@santi020k/og/content'
import { describe, expect, test } from 'vitest'

const ROOT = process.cwd()
const OG_DIR = path.join(ROOT, 'public', 'og')

// Mirrors the output rules in scripts/js/generate-og-images.js, including the
// legacy project alias, so stale files fail even after leaving the manifest.
const postOutputs = (entry: ContentEntry) => [`blog/${entry.slug.split('/').at(-1) ?? entry.slug}.webp`]
const projectOutputs = (entry: ContentEntry) => [
  `portfolio/${entry.slug}-logo.webp`,
  `portfolio/${entry.slug}.webp`
]

const collections = [
  { directory: 'src/content/post', outputs: postOutputs },
  { directory: 'src/content/project', outputs: projectOutputs }
]

const isDraft = (entry: ContentEntry) => entry.frontmatter.draft === true

describe('draft OG assets', () => {
  test.each(collections)('keeps draft outputs out of public/og for $directory', async ({ directory, outputs }) => {
    const entries = await readContent({ directory, exclude: ['AGENTS.md'], root: ROOT })
    const unexpected = entries
      .filter(isDraft)
      .flatMap(outputs)
      .filter(output => existsSync(path.join(OG_DIR, output)))

    expect(unexpected, 'Regenerate without OG_INCLUDE_DRAFTS, or remove obsolete draft outputs absent from .og-cache.json.').toEqual([])
  })

  test('finds existing non-draft post images', async () => {
    const entries = await readContent({ directory: 'src/content/post', exclude: ['AGENTS.md'], root: ROOT })
    // Future-dated posts also stay unpublished, so this only guards against an empty or wrong root.
    const existing = entries
      .filter(entry => !isDraft(entry))
      .flatMap(postOutputs)
      .filter(output => existsSync(path.join(OG_DIR, output)))

    expect(existing.length).toBeGreaterThan(0)
  })

  test('preserves generated project images and aliases', async () => {
    const entries = await readContent({ directory: 'src/content/project', exclude: ['AGENTS.md'], root: ROOT })
    const outputs = entries.filter(entry => !isDraft(entry)).flatMap(projectOutputs)

    expect(outputs.length).toBeGreaterThan(0)
    expect(outputs.filter(output => !existsSync(path.join(OG_DIR, output)))).toEqual([])
  })
})
