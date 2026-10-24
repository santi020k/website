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

test('checks picture sources and every width or density candidate in responsive images', async () => {
  await withSite(async directory => {
    await writeFile(path.join(directory, 'index.html'), document(`
      <picture>
        <source srcset="/missing.avif 1x, /large.avif 2x">
        <img src="/fallback.webp" srcset="/small.webp 320w,/missing-large.webp 640w" alt="Fixture">
      </picture>
    `))

    for (const asset of ['large.avif', 'fallback.webp', 'small.webp']) {
      await writeFile(path.join(directory, asset), 'fixture')
    }

    expect((await auditBuiltPages(directory)).issues).toEqual([
      { route: '/', kind: 'missing-target', target: '/missing.avif' },
      { route: '/', kind: 'missing-target', target: '/missing-large.webp' }
    ])
  })
})

test('preserves commas in srcset URLs and ignores external and embedded image candidates', async () => {
  await withSite(async directory => {
    await writeFile(path.join(directory, 'index.html'), document(`
      <img srcset="/small.webp, /image,large.webp 2x" alt="Local">
      <img srcset="data:image/png;base64,AAAA 1x, /small.webp 2x" alt="Embedded">
      <source srcset="https://example.com/image.webp 1x, //cdn.example.com/image.webp 2x">
    `))

    await writeFile(path.join(directory, 'small.webp'), 'fixture')
    await writeFile(path.join(directory, 'image,large.webp'), 'fixture')

    expect(await auditBuiltPages(directory)).toEqual({ pages: 1, targets: 2, issues: [] })
  })
})

test('rejects percent-encoded traversal outside the build root while accepting encoded in-root assets', async () => {
  await withSite(async directory => {
    const build = path.join(directory, 'dist')
    const outsideFile = 'outside.txt'
    const outsidePage = 'outside/'
    const siblingFile = 'dist-sibling/file.txt'
    const encodedAsset = 'caf%C3%A9.txt'
    const lowerTraversal = `/%2e%2e%2f${outsideFile}`
    const upperTraversal = `/%2E%2E%2F${outsideFile}`
    const mixedTraversal = `/..%2f${outsideFile}`
    const pageTraversal = `/%2e%2e%2f${outsidePage}`
    const siblingTraversal = `/%2e%2e%2f${siblingFile}`
    const insideTraversal = `/files/%2e%2e%2f${encodedAsset}`

    await mkdir(path.join(build, 'files'), { recursive: true })
    await mkdir(path.join(directory, 'outside'))
    await mkdir(path.join(directory, 'dist-sibling'))
    await writeFile(path.join(directory, siblingFile), 'outside')
    await writeFile(path.join(directory, 'outside.txt'), 'outside')
    await writeFile(path.join(directory, 'outside/index.html'), document('Outside'))
    await writeFile(path.join(build, 'café.txt'), 'fixture')
    await writeFile(path.join(build, 'files/space name.txt'), 'fixture')
    await writeFile(path.join(build, 'index.html'), document(`
      <a href="/caf%C3%A9.txt">Encoded asset</a>
      <a href="/files/space%20name.txt">Encoded space</a>
      <a href="${insideTraversal}">Normalized local asset</a>
      <a href="${lowerTraversal}">Lowercase traversal</a>
      <a href="${upperTraversal}">Uppercase traversal</a>
      <a href="${mixedTraversal}">Mixed traversal</a>
      <a href="${pageTraversal}">Outside page</a>
      <a href="${siblingTraversal}">Sibling with the same prefix</a>
    `))

    expect((await auditBuiltPages(build)).issues).toEqual([
      { route: '/', kind: 'missing-target', target: lowerTraversal },
      { route: '/', kind: 'missing-target', target: upperTraversal },
      { route: '/', kind: 'missing-target', target: mixedTraversal },
      { route: '/', kind: 'missing-target', target: pageTraversal },
      { route: '/', kind: 'missing-target', target: siblingTraversal }
    ])
  })
})

test('validates fragments through paths without trailing slashes, index.html, and percent-encoded page aliases', async () => {
  await withSite(async directory => {
    await mkdir(path.join(directory, 'article'))
    await mkdir(path.join(directory, 'café'))
    await writeFile(path.join(directory, 'article/index.html'), document('<p id="present">Article</p>'))
    await writeFile(path.join(directory, 'café/index.html'), document('<p id="intro">Café</p>'))
    await writeFile(path.join(directory, 'index.html'), document(`
      <a href="/article#present">Without slash</a>
      <a href="/article/index.html#present">Index document</a>
      <a href="/%61%72%74%69%63%6c%65/#present">Encoded ASCII</a>
      <a href="/caf%C3%A9/#intro">Encoded</a>
      <a href="/caf%C3%A9#intro">Encoded without-slash</a>
      <a href="/caf%C3%A9/index.html#intro">Encoded index document</a>
      <a href="/article#missing">Without slash missing</a>
      <a href="/article/index.html#missing">Index document missing</a>
      <a href="/%61%72%74%69%63%6c%65/#missing">Encoded ASCII missing</a>
      <a href="/caf%C3%A9/#missing">Encoded missing</a>
      <a href="/caf%C3%A9#missing">Encoded without-slash missing</a>
      <a href="/caf%C3%A9/index.html#missing">Encoded index document missing</a>
    `))

    expect((await auditBuiltPages(directory)).issues).toEqual([
      { route: '/', kind: 'missing-fragment', target: '/article#missing' },
      { route: '/', kind: 'missing-fragment', target: '/article/index.html#missing' },
      { route: '/', kind: 'missing-fragment', target: '/%61%72%74%69%63%6c%65/#missing' },
      { route: '/', kind: 'missing-fragment', target: '/caf%C3%A9/#missing' },
      { route: '/', kind: 'missing-fragment', target: '/caf%C3%A9#missing' },
      { route: '/', kind: 'missing-fragment', target: '/caf%C3%A9/index.html#missing' }
    ])
  })
})

test('validates fragments on redirect destinations written as page aliases', async () => {
  await withSite(async directory => {
    await mkdir(path.join(directory, 'article'))
    await mkdir(path.join(directory, 'café'))
    await writeFile(path.join(directory, 'article/index.html'), document('<p id="present">Article</p>'))
    await writeFile(path.join(directory, 'café/index.html'), document('<p id="intro">Café</p>'))
    await writeFile(path.join(directory, '_redirects'), [
      '/legacy-without-slash/ /article 301',
      '/legacy-index/ /article/index.html 301',
      '/legacy-encoded/ /caf%C3%A9/ 301'
    ].join('\n'))
    await writeFile(path.join(directory, 'index.html'), document(`
      <a href="/legacy-without-slash/#present">Without slash</a>
      <a href="/legacy-index/#present">Index document</a>
      <a href="/legacy-encoded/#intro">Encoded</a>
      <a href="/legacy-without-slash/#missing">Without slash missing</a>
      <a href="/legacy-index/#missing">Index document missing</a>
      <a href="/legacy-encoded/#missing">Encoded missing</a>
    `))

    expect((await auditBuiltPages(directory)).issues).toEqual([
      { route: '/', kind: 'missing-fragment', target: '/legacy-without-slash/#missing' },
      { route: '/', kind: 'missing-fragment', target: '/legacy-index/#missing' },
      { route: '/', kind: 'missing-fragment', target: '/legacy-encoded/#missing' }
    ])
  })
})

test('validates 404.html fragments without treating non-HTML asset fragments as page IDs', async () => {
  await withSite(async directory => {
    await writeFile(path.join(directory, '404.html'), document('<p id="recovery">Recovery</p>'))
    await writeFile(path.join(directory, 'guide.pdf'), 'fixture')
    await writeFile(path.join(directory, 'sprite.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="icon"></symbol></svg>')
    await writeFile(path.join(directory, 'index.html'), document(`
      <a href="/404/#recovery">Recovery</a>
      <a href="/404.html#recovery">Recovery document</a>
      <a href="/404.html#missing">Recovery document missing</a>
      <a href="/guide.pdf#page=2">Guide</a>
      <a href="/sprite.svg#icon">Icon</a>
      <a href="/sprite.svg#absent">Absent icon</a>
    `))

    expect((await auditBuiltPages(directory)).issues).toEqual([
      { route: '/', kind: 'missing-fragment', target: '/404.html#missing' }
    ])
  })
})

test('rejects a directory named index.html as a directory index target', async () => {
  await withSite(async directory => {
    await mkdir(path.join(directory, 'article'))
    await mkdir(path.join(directory, 'broken/index.html'), { recursive: true })
    await writeFile(path.join(directory, 'article/index.html'), document('Article'))
    await writeFile(path.join(directory, 'index.html'), document(`
      <a href="/article/">Article</a>
      <a href="/broken/">Broken</a>
      <a href="/broken">Broken without-slash</a>
      <a href="/broken/index.html">Broken index document</a>
    `))

    expect((await auditBuiltPages(directory)).issues).toEqual([
      { route: '/', kind: 'missing-target', target: '/broken/' },
      { route: '/', kind: 'missing-target', target: '/broken' },
      { route: '/', kind: 'missing-target', target: '/broken/index.html' }
    ])
  })
})
