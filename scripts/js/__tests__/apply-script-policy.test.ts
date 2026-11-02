// @vitest-environment node
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { applyScriptPolicy, findInlineScriptAttributes, hashScript, readHeaderScriptSources } from '../apply-script-policy.mjs'

const directories: string[] = []

const sha256 = (source: string) => `'sha256-${createHash('sha256').update(source).digest('base64')}'`

const createBuild = async (pages: Record<string, string>) => {
  const root = await mkdtemp(join(tmpdir(), 'website-policy-'))

  directories.push(root)
  await mkdir(join(root, 'dist'), { recursive: true })
  await writeFile(join(root, 'dist/_headers'), await readFile('public/_headers'))

  for (const [file, html] of Object.entries(pages)) {
    await mkdir(dirname(join(root, 'dist', file)), { recursive: true })
    await writeFile(join(root, 'dist', file), html)
  }

  return root
}

const page = (body: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Page</title></head><body>${body}</body></html>`

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('script policy', () => {
  test('keeps the deployed script origins and drops unsafe-inline', async () => {
    const headers = await readFile('public/_headers', 'utf8')

    expect(readHeaderScriptSources(headers)).toEqual([
      '\'self\'',
      '\'wasm-unsafe-eval\'',
      'https://giscus.app',
      'https://static.cloudflareinsights.com'
    ])
  })

  test('hashes the text browsers execute, after newline normalization', () => {
    expect(hashScript('a()\r\nb()')).toBe(sha256('a()\nb()'))
  })

  test('applies one policy with every inline script hash to each current page', async () => {
    const root = await createBuild({
      'index.html': page('<script>theme()</script><script type="module">nav()</script>'),
      'about/index.html': page('<script>theme()</script><script type="application/ld+json">{"@type":"Person"}</script><script type="module" src="/_astro/a.js"></script>'),
      'blog/post/index.html': page('<script type="module">copy()</script>'),
      'v1/index.html': page('<button onclick="legacy()">Archived</button><script>legacy()</script>')
    })

    const result = await applyScriptPolicy(root)

    expect(result.files).toBe(3)
    expect(result.hashes).toEqual([sha256('copy()'), sha256('nav()'), sha256('theme()')].sort())

    const about = await readFile(join(root, 'dist/about/index.html'), 'utf8')

    expect(about).toContain(`<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${result.policy}">`)
    expect(result.policy).not.toContain('unsafe-inline')
    expect(result.policy).toContain(sha256('copy()'))
    // Archives keep the header policy, which still allows their inline handlers.
    expect(await readFile(join(root, 'dist/v1/index.html'), 'utf8')).not.toContain('Content-Security-Policy')
  })

  test('replaces an earlier policy instead of stacking a second one', async () => {
    const root = await createBuild({ 'index.html': page('<script>theme()</script>') })

    await applyScriptPolicy(root)
    await applyScriptPolicy(root)

    const html = await readFile(join(root, 'dist/index.html'), 'utf8')

    expect(html.match(/http-equiv="Content-Security-Policy"/gu)).toHaveLength(1)
  })

  test('fails the build when a page relies on inline handlers or javascript: URLs', async () => {
    expect(findInlineScriptAttributes(page('<div data-example="onclick=x" title="a > b">Text</div><script>"<b onload=1>"</script>'))).toEqual([])
    expect(findInlineScriptAttributes(page('<a href="javascript:void(0)">Open</a><img src=x onerror=y>'))).toHaveLength(2)

    const root = await createBuild({ 'index.html': page('<button onclick="save()">Save</button>') })

    await expect(applyScriptPolicy(root)).rejects.toThrow(/index\.html: <button onclick="save\(\)">/u)
  })
})
