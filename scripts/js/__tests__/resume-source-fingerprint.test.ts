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

describe('resume source freshness', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test.each(['src/utils/date.ts', 'src/utils/content.ts', 'src/components/shared/BaseHead.astro', 'public/fonts/montserrat-variable-font-wght.ttf', 'public/fonts/montserrat-variable-font-wght.woff2'])('detects changes to local render dependency %s', async sourcePath => {
    const root = await mkdtemp(join(tmpdir(), 'resume-sources-'))

    try {
      for (const path of resumeSourcePaths) {
        const destination = join(root, path)

        await mkdir(dirname(destination), { recursive: true })
        await copyFile(join(process.cwd(), path), destination)
      }

      const before = await getResumeSourceHash(root)

      await writeFile(join(root, sourcePath), '// Changed render dependency')

      expect(await getResumeSourceHash(root)).not.toBe(before)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
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
