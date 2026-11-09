import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'

let root = ''

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'website-country-content-'))
  mkdirSync(join(root, 'src/content/country'), { recursive: true })
  mkdirSync(join(root, 'src/content/series'), { recursive: true })
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

const runContentLint = () => spawnSync(process.execPath, [join(process.cwd(), 'scripts/js/content-lint.mjs')], {
  cwd: root,
  encoding: 'utf8'
})

describe('country content lint', () => {
  test('accepts unanswered country notes without duplicated title and description', () => {
    writeFileSync(join(root, 'src/content/country/japan.md'), [
      '---',
      'code: JP',
      'score: null',
      'summary: \'\'',
      'visitedWhen: \'\'',
      'highlights: []',
      'wouldReturn: null',
      'language: en',
      '---',
      '<!-- Add personal notes here. -->'
    ].join('\n'))

    const result = runContentLint()

    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
  })

  test.each([
    { fields: 'code: XX', issue: 'code' },
    { fields: 'code: JP\nscore: 11', issue: 'score' },
    { fields: 'code: JP\nscore: .inf', issue: 'score' },
    { fields: 'code: JP\nwouldReturn: always', issue: 'wouldReturn' },
    { fields: 'code: JP\nlanguage: fr', issue: 'language' }
  ])('reports the shared country schema error for $issue', ({ fields, issue }) => {
    writeFileSync(join(root, 'src/content/country/japan.md'), `---\n${fields}\n---\n`)

    const result = runContentLint()

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`japan.md: ${issue}:`)
    expect(result.stderr).not.toContain('title must be')
  })

  test('retains title and description requirements outside the country collection', () => {
    writeFileSync(join(root, 'src/content/series/example.md'), '---\ncode: JP\n---\n')

    const result = runContentLint()

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('title must be between 3 and 100 characters')
    expect(result.stderr).toContain('description must be between 20 and 320 characters')
  })
})
