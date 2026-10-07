import { describe, expect, test } from 'vitest'

import { collectSitemapEntries, deduplicateSitemapSources, renderSitemap } from '../sitemap.mjs'

const origin = 'https://santi020k.com'
const source = { origin, sitemap: '/sitemap-index.xml' }

describe('cross-site sitemap', () => {
  test('fetches a shared theme hub once while retaining distinct origins and paths', () => {
    const sources = [
      { origin: 'https://theme.santi020k.com', sitemap: '/sitemap.xml' },
      { origin: 'https://theme.santi020k.com/', sitemap: 'https://theme.santi020k.com/sitemap.xml' },
      { origin: 'https://theme.santi020k.com', sitemap: '/other.xml' },
      { origin: 'https://lumen.santi020k.com', sitemap: '/sitemap.xml' }
    ]

    expect(deduplicateSitemapSources(sources)).toEqual([sources[0], sources[2], sources[3]])
  })

  test('a duplicate optional source cannot weaken required-source validation', () => {
    const optional = { ...source, required: false }
    const required = { ...source, required: true }

    expect(deduplicateSitemapSources([optional, required])).toEqual([required])
    expect(deduplicateSitemapSources([required, optional])).toEqual([required])
  })

  test('flattens nested indexes, keeps lastmod, and deduplicates cyclic sources', async () => {
    const documents = new Map([
      [`${origin}/sitemap-index.xml`, `<sitemapindex><sitemap><loc>${origin}/pages.xml</loc></sitemap><sitemap><loc>${origin}/sitemap-index.xml</loc></sitemap></sitemapindex>`],
      [`${origin}/pages.xml`, `<urlset><url><loc>${origin}/blog/example/</loc><lastmod>2026-10-06T12:00:00.000Z</lastmod></url><url><loc>${origin}/</loc></url><url><loc>${origin}/blog/example/</loc></url></urlset>`]
    ])
    const entries = await collectSitemapEntries(source, url => {
      const document = documents.get(url)

      if (!document) throw new Error(`Unexpected sitemap: ${url}`)

      return Promise.resolve(document)
    })

    expect(entries).toEqual([
      { url: `${origin}/blog/example/`, lastmod: '2026-10-06T12:00:00.000Z' },
      { url: `${origin}/` }
    ])
    expect(renderSitemap(entries)).toContain('<lastmod>2026-10-06T12:00:00.000Z</lastmod>')
  })

  test.each([
    '<urlset><url><loc>https://example.com/</loc></url></urlset>',
    '<sitemapindex><sitemap><loc>https://example.com/sitemap.xml</loc></sitemap></sitemapindex>',
    `<urlset><url><loc>${origin}/</loc><lastmod>not-a-date</lastmod></url></urlset>`,
    '<html><body>Missing sitemap</body></html>',
    `<urlset><url><loc>${origin}/</loc></urlset>`,
    '<urlset><url><lastmod>2026-10-06</lastmod></url></urlset>'
  ])('rejects untrusted origins and invalid source metadata', async document => {
    await expect(collectSitemapEntries(source, () => Promise.resolve(document))).rejects.toThrow()
  })

  test.each(['2026-02-31', '2026-02-29', '1900-02-29', '2026-00-01', '2026-01-00', '2026-10-06T24:00:00Z', '2026-10-06T12:60:00Z', '2026-10-06T12:00:60Z', '2026-10-06T12:00:00+14:30'])('rejects impossible lastmod dates and timestamp ranges: %s', async lastmod => {
    await expect(collectSitemapEntries(source, () => Promise.resolve(
      `<urlset><url><loc>${origin}/</loc><lastmod>${lastmod}</lastmod></url></urlset>`
    ))).rejects.toThrow('valid date or timestamp')
  })

  test.each(['2000-02-29', '2024-02-29', '2026-10-06T12:00:00+14:00'])('preserves valid leap dates and timezone offsets: %s', async lastmod => {
    const entries = await collectSitemapEntries(source, () => Promise.resolve(
      `<urlset><url><loc>${origin}/</loc><lastmod>${lastmod}</lastmod></url></urlset>`
    ))

    expect(entries).toEqual([{ url: `${origin}/`, lastmod }])
  })

  test('preserves date-only lastmod values and escapes XML locations', async () => {
    const entries = await collectSitemapEntries(source, () => Promise.resolve(
      `<urlset><url><loc>${origin}/search/?a=1&amp;b=2</loc><lastmod>2026-10-06</lastmod></url></urlset>`
    ))

    expect(entries[0]?.lastmod).toBe('2026-10-06')
    expect(renderSitemap(entries)).toContain('<loc>https://santi020k.com/search/?a=1&amp;b=2</loc>')
  })
})
