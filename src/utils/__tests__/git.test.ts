import { execFileSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

import { getGitLastModified } from '../git'

describe('getGitLastModified', () => {
  test('returns the latest committed date for tracked paths', () => {
    const path = 'src/pages/resume.astro'
    const expected = new Date(execFileSync(
      'git', ['log', '-1', '--format=%cI', '--', path], { encoding: 'utf8' }
    ).trim()).toISOString()

    expect(getGitLastModified([path], '2024-01-01T00:00:00.000Z')).toBe(expected)
  })

  test('uses a stable fallback when no Git date is available', () => {
    const fallback = '2024-01-01T00:00:00.000Z'

    expect(getGitLastModified(['path-that-does-not-exist'], fallback)).toBe(fallback)
  })
})
