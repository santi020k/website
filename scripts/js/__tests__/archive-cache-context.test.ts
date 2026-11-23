// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test, vi } from 'vitest'

import { getProjectDurationLabel as v2Duration } from '../../../apps/v2/src/utils/project-meta'
import { getProjectDurationLabel as v3Duration } from '../../../apps/v3/src/utils/project-meta'
import { archiveCacheContext, archiveEnvironment, archiveIdentity } from '../archive-cache-context.mjs'

describe('archive build identity', () => {
  const input = { now: new Date(2026, 10, 16, 9), runtime: 'v24:linux:x64', timezone: 'UTC', history: 'archive-commit:date' }

  test('archive durations keep the captured day when a build crosses midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 16, 1))
    vi.stubEnv('WEBSITE_ARCHIVE_BUILD_DATE', new Date(2026, 1, 15, 12).toISOString())

    try {
      for (const duration of [v2Duration, v3Duration]) {
        expect(duration(new Date(2026, 0, 16))).toBe('1 mo')
        expect(duration(new Date(2026, 0, 16), new Date(2026, 1, 16))).toBe('2 mo')
      }
    } finally {
      vi.unstubAllEnvs()
      vi.useRealTimers()
    }
  })

  test('reuses the same calendar day and invalidates every non-file build input', () => {
    const identity = archiveIdentity(input).identity

    expect(archiveIdentity({ ...input, now: new Date(2026, 10, 16, 21) }).identity).toBe(identity)
    for (const changed of [
      { now: new Date(2026, 10, 17) },
      { runtime: 'v25:linux:x64' },
      { timezone: 'America/Bogota' },
      { history: 'archive-commit:new-date' }
    ]) expect(archiveIdentity({ ...input, ...changed }).identity).not.toBe(identity)
  })

  test('missing Git history never reuses a previous fallback build', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'website-cache-missing-'))

    try {
      const first = archiveCacheContext({ cwd })
      const second = archiveCacheContext({ cwd })

      expect(first.reusable).toBe(false)
      expect(second.identity).not.toBe(first.identity)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  test('archive history changes invalidate reuse while current-site-only commits do not', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'website-cache-history-'))
    const environment = archiveEnvironment(process.env)
    const git = (...args: string[]) => execFileSync('git', args, { cwd, env: environment, stdio: 'pipe' })

    try {
      git('init', '-q')
      git('config', 'user.name', 'Fixture')
      git('config', 'user.email', 'fixture@example.test')
      mkdirSync(join(cwd, 'apps/v3'), { recursive: true })
      writeFileSync(join(cwd, 'apps/v3/resume'), 'resume')
      git('add', '.')
      git('commit', '-qm', 'archive')
      const first = archiveCacheContext({ cwd })

      expect(first.reusable).toBe(true)
      writeFileSync(join(cwd, 'current.txt'), 'current site')
      git('add', '.')
      git('commit', '-qm', 'current')
      expect(archiveCacheContext({ cwd }).identity).toBe(first.identity)
      writeFileSync(join(cwd, 'apps/v3/resume'), 'updated resume')
      git('add', '.')
      git('commit', '-qm', 'archive update')
      expect(archiveCacheContext({ cwd }).identity).not.toBe(first.identity)
      expect(archiveCacheContext({ cwd, environment: { ...environment, GIT_DIR: '/missing' } }).reusable).toBe(true)
      writeFileSync(join(cwd, '.git/shallow'), `${execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim()}\n`)
      expect(archiveCacheContext({ cwd }).reusable).toBe(false)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
