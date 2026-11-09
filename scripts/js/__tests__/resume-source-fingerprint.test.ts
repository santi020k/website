// @vitest-environment node
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import { getResumeSourceHash, resumeSourcePaths } from '../resume-source-fingerprint.mjs'

const hashAt = async (date: string) => {
  vi.setSystemTime(new Date(date))

  return getResumeSourceHash()
}

const withResumeSources = async (run: (root: string) => Promise<void>) => {
  const root = await mkdtemp(join(tmpdir(), 'resume-sources-'))

  try {
    for (const path of resumeSourcePaths) {
      const destination = join(root, path)

      await mkdir(dirname(destination), { recursive: true })
      await copyFile(join(process.cwd(), path), destination)
    }

    await run(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

describe('resume source freshness', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test.each(['src/data/project.ts', 'src/utils/date.ts', 'src/utils/content-date.ts', 'src/utils/content.ts', 'src/content-translations.ts', 'src/utils/content-translations.ts', 'src/utils/links.ts', 'src/components/molecules/ResumeEvidenceNote.astro', 'src/components/shared/BaseHead.astro', 'src/components/atoms/ArrowSprite.astro', 'src/styles/pages/resume.css', 'public/fonts/montserrat-variable-font-wght.ttf', 'public/fonts/montserrat-variable-font-wght.woff2', 'src/assets/fonts/montserrat-variable-font-wght.latin.woff2', 'src/assets/fonts/montserrat-italic-variable-font-wght.latin.woff2'])('detects changes to local render dependency %s', async sourcePath => {
    await withResumeSources(async root => {
      const before = await getResumeSourceHash(root)

      await writeFile(join(root, sourcePath), '// Changed render dependency')

      expect(await getResumeSourceHash(root)).not.toBe(before)
    })
  })

  test('ignores package version changes but detects render dependency changes', async () => {
    await withResumeSources(async root => {
      const manifest = join(root, 'package.json')

      await writeFile(manifest, JSON.stringify({ version: '5.0.0', dependencies: { astro: '7.0.0' } }))
      const before = await getResumeSourceHash(root)

      await writeFile(manifest, JSON.stringify({ version: '5.1.0', dependencies: { astro: '7.0.0' } }))
      expect(await getResumeSourceHash(root)).toBe(before)

      await writeFile(manifest, JSON.stringify({ version: '5.1.0', dependencies: { astro: '7.1.0' } }))
      expect(await getResumeSourceHash(root)).not.toBe(before)
    })
  })

  test('changes at a calendar-year rollover without source edits', async () => {
    vi.useFakeTimers()

    const previousYear = await hashAt('2026-12-31T12:00:00')
    const nextYear = await hashAt('2027-01-01T12:00:00')

    expect(nextYear).not.toBe(previousYear)
  })

  test('stays stable within the same render year', async () => {
    vi.useFakeTimers()

    const january = await hashAt('2026-01-01T12:00:00')
    const december = await hashAt('2026-12-31T12:00:00')

    expect(december).toBe(january)
  })
})
