import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { hasNoindexDirective, isNoindexBuiltPage, readBuiltPageHead } from '../built-page'

describe('noindex directives', () => {
  test.each([
    ['<meta name="robots" content="noindex, follow">', true],
    ['<meta content="NOINDEX" name="robots" />', true],
    ['<meta name=\'robots\' content=\'follow,noindex\'>', true],
    ['<meta name="robots" content="index, follow, max-snippet:-1">', false],
    ['<meta name="description" content="noindex">', false],
    ['<meta name="robots">', false],
    ['<title>noindex</title>', false]
  ])('reads %s', (html, expected) => {
    expect(hasNoindexDirective(`<head>${html}</head>`)).toBe(expected)
  })
})

describe('built pages', () => {
  let outDir = ''

  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'built-page-'))
    fs.mkdirSync(path.join(outDir, 'es', 'blog', 'post'), { recursive: true })
    fs.mkdirSync(path.join(outDir, 'blog', 'tags', 'c#'), { recursive: true })
    fs.writeFileSync(path.join(outDir, 'es', 'blog', 'post', 'index.html'), '<meta name="robots" content="noindex, follow">')
    fs.writeFileSync(path.join(outDir, 'blog', 'tags', 'c#', 'index.html'), '<meta name="robots" content="index, follow">')
    fs.writeFileSync(path.join(outDir, '404.html'), '<meta name="robots" content="noindex, follow">')
  })

  afterAll(() => {
    fs.rmSync(outDir, { force: true, recursive: true })
  })

  test('finds directory and file documents, including encoded paths', () => {
    expect(isNoindexBuiltPage(outDir, 'https://santi020k.com/es/blog/post/')).toBe(true)
    expect(isNoindexBuiltPage(outDir, 'https://santi020k.com/blog/tags/c%23/')).toBe(false)
    expect(isNoindexBuiltPage(outDir, 'https://santi020k.com/404')).toBe(true)
  })

  test('treats missing or out-of-tree documents as indexable', () => {
    expect(readBuiltPageHead(outDir, 'https://santi020k.com/missing/')).toBeUndefined()
    expect(isNoindexBuiltPage(outDir, 'https://santi020k.com/missing/')).toBe(false)
    expect(readBuiltPageHead(outDir, 'https://santi020k.com/%2e%2e/%2e%2e/etc/')).toBeUndefined()
  })
})
