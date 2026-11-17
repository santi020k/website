import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { findMarkdownFiles, readContentFiles } from '../utils/frontmatter.mjs'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'website-frontmatter-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('content discovery', () => {
  test('returns sorted Markdown paths and accepts an existing empty directory', async () => {
    expect(await findMarkdownFiles(root)).toEqual([])
    await mkdir(path.join(root, 'nested'))
    await writeFile(path.join(root, 'second.mdx'), '---\ntitle: Second\n---\nBody')
    await writeFile(path.join(root, 'nested/first.md'), '---\ntitle: First\n---\nBody')
    await writeFile(path.join(root, 'image.webp'), '')

    expect(await findMarkdownFiles(root)).toEqual([
      path.join(root, 'nested/first.md'),
      path.join(root, 'second.mdx')
    ])
  })

  test('rejects a missing required collection instead of treating it as empty', async () => {
    const missing = path.join(root, 'missing')

    await expect(findMarkdownFiles(missing)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readContentFiles(missing)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  test('rejects a collection path that names a file', async () => {
    const file = path.join(root, 'collection.md')

    await writeFile(file, '---\ntitle: Example\n---\nBody')

    await expect(findMarkdownFiles(file)).rejects.toMatchObject({ code: 'ENOTDIR' })
  })

  test.skipIf(process.getuid?.() === 0 || process.platform === 'win32')('propagates unreadable nested directory errors', async () => {
    const locked = path.join(root, 'locked')

    await mkdir(locked)
    await chmod(locked, 0)

    try {
      await expect(findMarkdownFiles(root)).rejects.toMatchObject({ code: 'EACCES' })
    } finally {
      await chmod(locked, 0o700)
    }
  })
})
