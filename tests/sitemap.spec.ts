import { expect, test } from '@playwright/test'

test('combined sitemap advertises canonical pages and preserves content dates', async ({ page }) => {
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
        lastmod: entry.querySelector('lastmod')?.textContent ?? null
      }))
    }

    return { root: parse(rootXml), combined: parse(combinedXml) }
  }, { rootXml: await rootResponse.text(), combinedXml: await combinedResponse.text() })

  const combinedByUrl = new Map(combined.map(entry => [entry.url, entry]))

  expect(combinedByUrl.size).toBe(combined.length)
  expect(combinedByUrl.has('https://santi020k.com/')).toBe(true)
  expect(root.some(entry => entry.lastmod !== null)).toBe(true)

  for (const entry of root) expect(combinedByUrl.get(entry.url)).toEqual(entry)

  for (const entry of combined) {
    expect(new URL(entry.url).protocol).toBe('https:')
    expect(entry.url).not.toMatch(/\/(?:offline|404)\/$/u)
  }
})
