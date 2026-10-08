// @vitest-environment node
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { afterEach, describe, expect, test } from 'vitest'

import { lintMarkdown } from '../lint-markdown.mjs'

const execFileAsync = promisify(execFile)
const runner = path.resolve(import.meta.dirname, '../lint-markdown.mjs')
const directories: string[] = []

const fixture = async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'website-markdown-'))

  directories.push(directory)
  await mkdir(path.join(directory, 'docs/nested'), { recursive: true })
  await mkdir(path.join(directory, 'src/content/posts'), { recursive: true })

  return directory
}

describe('Markdown lint runner', () => {
  afterEach(async () => {
    await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
  })

  test('keeps the configured file scope and existing rule exceptions', async () => {
    const directory = await fixture()
    const content = '# Title\n\n<div>Inline HTML remains allowed.</div>\n'

    for (const file of ['README.md', 'docs/nested/guide.md', 'src/content/posts/post.md']) {
      await writeFile(path.join(directory, file), content)
    }

    await writeFile(path.join(directory, 'ignored.md'), 'Invalid heading')
    await writeFile(path.join(directory, 'src/content/posts/post.mdx'), 'Invalid heading')

    const { files, errorCount } = await lintMarkdown(directory)

    expect(files).toEqual(['README.md', 'docs/nested/guide.md', 'src/content/posts/post.md'])
    expect(errorCount).toBe(0)
  })

  test('reports rule names and line numbers and exits unsuccessfully on invalid Markdown', async () => {
    const directory = await fixture()

    await writeFile(path.join(directory, 'README.md'), 'Missing top-level heading\n')

    const { errorCount, diagnostics } = await lintMarkdown(directory)

    expect(errorCount).toBeGreaterThan(0)
    expect(diagnostics.join('\n')).toContain('MD041')
    expect(diagnostics.join('\n')).toContain('README.md:1')
    await expect(execFileAsync(process.execPath, [runner], { cwd: directory })).rejects.toMatchObject({ code: 1 })
  })

  test('fails instead of silently passing when no files match', async () => {
    const directory = await fixture()

    await expect(lintMarkdown(directory)).rejects.toThrow('No Markdown files matched')
    await expect(execFileAsync(process.execPath, [runner], { cwd: directory })).rejects.toMatchObject({ code: 1 })
  })

  test('exits successfully for valid Markdown', async () => {
    const directory = await fixture()

    await writeFile(path.join(directory, 'README.md'), '# Title\n')

    const { stdout } = await execFileAsync(process.execPath, [runner], { cwd: directory })

    expect(stdout).toContain('Markdown lint: 1 files, 0 issues')
  })
})
