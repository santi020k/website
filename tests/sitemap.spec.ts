import { expect, test } from '@playwright/test'

test('combined sitemap advertises canonical pages, content dates, and language alternates', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="sitemap"]')).toHaveAttribute('href', '/sitemap.xml')

  const rootResponse = await page.request.get('/sitemap-0.xml')
  const combinedResponse = await page.request.get('/sitemap.xml')

  expect(rootResponse.ok()).toBe(true)
  expect(combinedResponse.ok()).toBe(true)

  const { root, combined } = await page.evaluate(({ rootXml, combinedXml }) => {
    const parse = (xml: string) => {
      const document = new DOMParser().parseFromString(xml, 'application/xml')

      if (document.documentElement.localName !== 'urlset') throw new Error('Invalid sitemap XML')

      return [...document.querySelectorAll('url')].map(entry => ({
        url: entry.querySelector('loc')?.textContent ?? '',
        lastmod: entry.querySelector('lastmod')?.textContent ?? null,
        alternates: Array.from(entry.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link'), link => ({
          rel: link.getAttribute('rel'),
          hreflang: link.getAttribute('hreflang'),
          href: link.getAttribute('href')
        }))
      }))
    }

    return { root: parse(rootXml), combined: parse(combinedXml) }
  }, { rootXml: await rootResponse.text(), combinedXml: await combinedResponse.text() })

  const combinedByUrl = new Map(combined.map(entry => [entry.url, entry]))

  expect(combinedByUrl.size).toBe(combined.length)
  expect(combinedByUrl.get('https://santi020k.com/')?.alternates).toEqual(expect.arrayContaining([
    { rel: 'alternate', hreflang: 'en', href: 'https://santi020k.com/' },
    { rel: 'alternate', hreflang: 'es', href: 'https://santi020k.com/es/' }
  ]))
  expect(root.some(entry => entry.url.includes('/blog/') && entry.lastmod !== null)).toBe(true)

  // Refreshed case studies expose their verified editorial date.
  for (const [slug, lastmod] of [
    ['lumen-ui', '2026-10-20T00:00:00.000Z'],
    ['postlens', '2026-10-25T00:00:00.000Z'],
    ['between-contractions', '2026-10-20T00:00:00.000Z'],
    ['roadscore', '2026-10-20T00:00:00.000Z']
  ] as const) {
    expect(combinedByUrl.get(`https://santi020k.com/portfolio/${slug}/`)).toMatchObject({
      url: `https://santi020k.com/portfolio/${slug}/`,
      lastmod
    })
  }

  // Project dates alone must not invent a page modification date.
  expect(combinedByUrl.get('https://santi020k.com/portfolio/xgames/')).toMatchObject({
    url: 'https://santi020k.com/portfolio/xgames/',
    lastmod: null
  })

  for (const entry of root) expect(combinedByUrl.get(entry.url)).toEqual(entry)

  for (const entry of combined) {
    expect(new URL(entry.url).protocol).toBe('https:')
    expect(entry.url).not.toMatch(/\/(?:offline|404)\/$/u)
  }
})
