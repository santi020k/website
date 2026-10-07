import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'

let root = ''

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'website-title-draft-'))
  mkdirSync(join(root, 'src/content/post/2026/example'), { recursive: true })
  mkdirSync(join(root, 'src/content/series'), { recursive: true })
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('title-only draft content validation', () => {
  test.each([
    { name: 'unwritten draft without artwork', draft: true, body: '', cover: '', passes: true },
    { name: 'published post without artwork', draft: false, body: '', cover: '', passes: false },
    { name: 'written draft without artwork', draft: true, body: 'A first paragraph.', cover: '', passes: false },
    { name: 'unwritten draft with invalid artwork', draft: true, body: '', cover: 'coverImage:\n  alt: A meaningful image description\n  src: ./missing.webp\n', passes: false }
  ])('$name', ({ body, cover, draft, passes }) => {
    writeFileSync(join(root, 'src/content/post/2026/example/index.md'), [
      '---',
      'title: How I became a digital nomad',
      'description: How I became a digital nomad',
      `draft: ${draft}`,
      `${cover}---`,
      body
    ].join('\n'))

    const result = spawnSync(process.execPath, [join(process.cwd(), 'scripts/js/content-lint.mjs')], {
      cwd: root,
      encoding: 'utf8'
    })

    expect(result.status).toBe(passes ? 0 : 1)

    expect(result.stderr.includes('cover')).toBe(!passes)
  })
})
