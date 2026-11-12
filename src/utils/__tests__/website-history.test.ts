import { readFile } from 'node:fs/promises'

import { addArchiveNotice, archiveHeaderRules, archiveHtml, archiveSearchIndex, archiveUrl, isArchiveExit, readHeaderPolicy } from '@santi020k/website-history/archive'
import { describe, expect, test } from 'vitest'

describe('Website archive boundaries', () => {
  test('places the archive notice after the skip link and before archived navigation', () => {
    const html = '<body><script>setup()</script><a class="sr-only" href="#main">Skip to content</a><header>Navigation</header><main id="main">Content</main></body>'
    const notice = '<aside>Archive notice</aside>'

    expect(addArchiveNotice(html, notice)).toBe(html.replace('</a>', `</a>${notice}`))
    expect(() => addArchiveNotice('<body><header>Navigation</header></body>', notice)).toThrow('missing its skip link')
  })

  test.each([
    ['/blog/post/?q=astro#code', '/v2/blog/post/?q=astro#code'],
    ['/v2/blog/', '/v2/blog/'],
    ['/v2', '/v2'],
    ['//example.com/image.webp', '//example.com/image.webp'],
    ['https://example.com/', 'https://example.com/'],
    ['#heading', '#heading'],
    ['mailto:hi@santi020k.com', 'mailto:hi@santi020k.com']
  ])('keeps %s in the correct navigation scope', (value, expected) => {
    expect(archiveUrl(value, 'v2')).toBe(expected)
  })

  test('isolates local links and responsive images without changing external destinations', () => {
    const html = '<head><meta name="robots" content="index, follow"><link rel="sitemap" href="/sitemap.xml"></head><body><a href="/blog/">Blog</a><img src="/portrait.webp" srcset="/portrait.webp 400w, /large.webp 800w"><a href="https://example.com/">Elsewhere</a></body>'
    const result = archiveHtml(html, 'v1')

    expect(result).toContain('href="/v1/blog/"')
    expect(result).toContain('src="/v1/portrait.webp"')
    expect(result).toContain('srcset="/v1/portrait.webp 400w, /v1/large.webp 800w"')
    expect(result).toContain('href="https://example.com/"')
    expect(result).toContain('content="noindex, follow"')
    expect(result).not.toContain('rel="sitemap"')
    expect(archiveHtml(result, 'v1')).toBe(result)
  })

  test.each([
    ['https://santi020k.com', true],
    ['https://santi020k.com/about/?q=astro#team', true],
    ['//santi020k.com/blog/', true],
    ['HTTPS://SANTI020K.COM/', true],
    ['https://santi020k.com/v3/', true],
    ['https://santi020k.com/v4', false],
    ['https://santi020k.com/v4/blog/', false],
    ['https://santi020k.com/v40/', true],
    ['https://www.santi020k.com/', false],
    ['https://lumen.santi020k.com/', false],
    ['http://santi020k.com/', false],
    ['https://example.com/', false],
    ['https://[invalid/', false],
    ['/about/', false],
    ['#footer', false],
    ['mailto:hi@santi020k.com', false]
  ])('classifies %s as a v4 archive exit: %s', (value, expected) => {
    expect(isArchiveExit(value, 'v4')).toBe(expected)
  })

  test('forces a full load only for same-origin anchors that leave the archive', () => {
    const html = [
      '<head></head><body>',
      '<a class="maker-footer-wordmark" href="https://santi020k.com" aria-label="Santiago Molina — santi020k">santi020k</a>',
      '<a href=\'//santi020k.com/blog/\'>Protocol relative</a>',
      '<a href="https://santi020k.com/v4/blog/">Archived blog</a>',
      '<a href="https://example.com/">Elsewhere</a>',
      '<a href="#footer">Footer</a>',
      '<a href="mailto:hi@santi020k.com">Email</a>',
      '<a data-astro-reload="" href="https://santi020k.com/about/">Marked</a>',
      '<abbr title="https://santi020k.com">abbr</abbr>',
      '<link rel="canonical" href="https://santi020k.com/v4/">',
      '</body>'
    ].join('')
    const result = archiveHtml(html, 'v4')

    expect(result).toContain('<a data-astro-reload class="maker-footer-wordmark" href="https://santi020k.com" aria-label="Santiago Molina — santi020k">')
    expect(result).toContain('<a data-astro-reload href=\'//santi020k.com/blog/\'>')
    expect(result).toContain('<a href="https://santi020k.com/v4/blog/">')
    expect(result).toContain('<a href="https://example.com/">')
    expect(result).toContain('<a href="#footer">')
    expect(result).toContain('<a href="mailto:hi@santi020k.com">')
    expect(result).toContain('<a data-astro-reload="" href="https://santi020k.com/about/">')
    expect(result).toContain('<abbr title="https://santi020k.com">')
    expect(result).toContain('<link rel="canonical" href="https://santi020k.com/v4/">')
    expect(result.match(/data-astro-reload/g)).toHaveLength(3)
    expect(archiveHtml(result, 'v4')).toBe(result)
  })

  test('caches only hashed archive bundles immutably while excluding the archive from search indexing', () => {
    const rules = archiveHeaderRules('v2')

    expect(rules).toContain('\n/v2\n  X-Robots-Tag: noindex, follow\n')
    expect(rules).toContain('\n/v2/*\n  X-Robots-Tag: noindex, follow\n')
    expect(rules).toContain('\n/v2/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n')
    expect(rules.match(/immutable/g)).toHaveLength(1)
    expect(rules).not.toContain('Content-Security-Policy')
  })

  test('restores the source script policy for archived pages after detaching the current one', async () => {
    const policy = readHeaderPolicy(await readFile('public/_headers', 'utf8')) ?? ''

    expect(policy).toContain('script-src \'self\' \'unsafe-inline\'')

    const rules = archiveHeaderRules('v2', policy)

    expect(rules).toContain(`\n/v2/*\n  X-Robots-Tag: noindex, follow\n  ! Content-Security-Policy\n  Content-Security-Policy: ${policy}\n`)
    expect(rules.match(/Content-Security-Policy/g)).toHaveLength(2)
  })

  test('keeps search result destinations and thumbnails inside the archive', () => {
    const index = '[{"path":"/blog/post/","coverUrl":"/_astro/cover.webp","coverAvifUrl":"https://example.com/cover.avif"}]'
    const result = archiveSearchIndex(index, 'v2')
    expect(result).toContain('"path":"/v2/blog/post/"')
    expect(result).toContain('"coverUrl":"/v2/_astro/cover.webp"')
    expect(result).toContain('"coverAvifUrl":"https://example.com/cover.avif"')
    expect(archiveSearchIndex(result, 'v2')).toBe(result)
  })

  test('disables external submissions while leaving local search forms usable', () => {
    const result = archiveHtml('<head></head><form action="https://example.com/subscribe" method="post"><input></form><form role="search"><input></form>', 'v3')

    expect(result).toContain('<form inert aria-label="Archived form — submissions disabled">')
    expect(result).not.toContain('https://example.com/subscribe')
    expect(result).toContain('<form role="search">')
  })
})
