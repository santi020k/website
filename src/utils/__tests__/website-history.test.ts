import { archiveHtml, archiveSearchIndex, archiveUrl } from '@santi020k/website-history/archive'
import { describe, expect, test } from 'vitest'

describe('Website archive boundaries', () => {
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
