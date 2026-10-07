// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { expect, test } from 'vitest'

import { auditBuiltPages } from '../audit-built-pages.mjs'

const document = (body: string) => `<!doctype html><html lang="en"><head><title>Fixture</title></head><body><main><h1>Fixture</h1>${body}</main></body></html>`

const withSite = async (run: (directory: string) => Promise<void>) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'website-built-pages-'))

  try {
    await run(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('checks existing pages, assets, encoded fragments, recovery pages, and configured redirects', async () => {
  await withSite(async directory => {
    await mkdir(path.join(directory, 'article'))
    await writeFile(path.join(directory, 'index.html'), document('<a href="/article/#caf%C3%A9">Read</a><img src="/image.webp" alt="Fixture"><a href="/404/">Recovery</a><a href="/retired/">Legacy</a><a href="https://example.com/missing/">External</a>'))
    await writeFile(path.join(directory, 'article/index.html'), document('<p id="café">Content</p>'))
    await writeFile(path.join(directory, '404.html'), document('Recovery'))
    await writeFile(path.join(directory, 'image.webp'), 'fixture')
    await writeFile(path.join(directory, '_redirects'), '/retired/ /article/ 301\n')

    expect(await auditBuiltPages(directory)).toEqual({ pages: 3, targets: 4, issues: [] })
  })
})

test('reports broken assets, missing fragments, duplicate IDs, and missing landmarks', async () => {
  await withSite(async directory => {
    await writeFile(path.join(directory, 'index.html'), document('<a href="#missing">Missing section</a><img src="/missing.webp" alt="Missing"><p id="duplicate">One</p><p id="duplicate">Two</p>').replace('<main>', '<div>').replace('</main>', '</div>'))

    const result = await auditBuiltPages(directory)

    expect(result.pages).toBe(1)
    expect(result.issues).toEqual(expect.arrayContaining([
      { route: '/', kind: 'duplicate-id', target: 'duplicate' },
      { route: '/', kind: 'main-count' },
      { route: '/', kind: 'missing-fragment', target: '/#missing' },
      { route: '/', kind: 'missing-target', target: '/missing.webp' }
    ]))
    expect(result.issues).toHaveLength(4)
  })
})

test('allows Astro redirect documents while retaining validation of their links', async () => {
  await withSite(async directory => {
    await writeFile(path.join(directory, 'index.html'), '<html><head><meta http-equiv="refresh" content="0;url=/missing/"></head><body><a href="/missing/">Continue</a></body></html>')

    expect((await auditBuiltPages(directory)).issues).toEqual([{ route: '/', kind: 'missing-target', target: '/missing/' }])
  })
})

test('rejects an empty build instead of reporting a false passing audit', async () => {
  await withSite(async directory => {
    expect(await auditBuiltPages(directory)).toEqual({
      pages: 0,
      targets: 0,
      issues: [{ route: '/', kind: 'missing-documents' }]
    })
  })
})

test('rejects redirect cycles and missing destinations instead of accepting their source paths', async () => {
  await withSite(async directory => {
    await writeFile(path.join(directory, 'index.html'), document('<a href="/cycle/">Cycle</a><a href="/broken/">Broken</a>'))
    await writeFile(path.join(directory, '_redirects'), '/cycle/ /loop/ 301\n/loop/ /cycle/ 301\n/broken/ /missing/ 301\n')

    expect((await auditBuiltPages(directory)).issues).toEqual([
      { route: '/', kind: 'missing-target', target: '/cycle/' },
      { route: '/', kind: 'missing-target', target: '/broken/' }
    ])
  })
})

test('resolves wildcard redirects and validates fragments on the destination page', async () => {
  await withSite(async directory => {
    await mkdir(path.join(directory, 'article'))
    await writeFile(path.join(directory, 'index.html'), document('<a href="/old/article/#missing">Old article</a>'))
    await writeFile(path.join(directory, 'article/index.html'), document('<p id="present">Content</p>'))
    await writeFile(path.join(directory, '_redirects'), '/old/* /:splat 301\n')

    expect((await auditBuiltPages(directory)).issues).toEqual([
      { route: '/', kind: 'missing-fragment', target: '/old/article/#missing' }
    ])
  })
})
