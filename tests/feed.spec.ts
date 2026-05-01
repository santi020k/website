import { expect, test } from '@playwright/test'

test.describe('RSS feed', () => {
  test('/feed.xml responds with 200', async ({ request }) => {
    const response = await request.get('/feed.xml')
    expect(response.status()).toBe(200)
  })

  test('/feed.xml returns XML content', async ({ request }) => {
    const response = await request.get('/feed.xml')
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toMatch(/xml/)
  })

  test('/feed.xml contains a valid RSS channel element', async ({ request }) => {
    const response = await request.get('/feed.xml')
    const body = await response.text()

    expect(body).toContain('<rss')
    expect(body).toContain('<channel>')
    expect(body).toContain('<title>')
    expect(body).toContain('</channel>')
  })

  test('/feed.xml includes at least one blog post item', async ({ request }) => {
    const response = await request.get('/feed.xml')
    const body = await response.text()

    expect(body).toContain('<item>')
  })

  test('/feed.xml items link to /blog/ paths', async ({ request }) => {
    const response = await request.get('/feed.xml')
    const body = await response.text()

    // All post links should be under /blog/
    const linkMatches = body.match(/<link>(.*?)<\/link>/g) ?? []
    const postLinks = linkMatches.filter(link => link.includes('/blog/'))
    expect(postLinks.length).toBeGreaterThan(0)
  })

  test('/feed.xml exposes per-item categories from tags', async ({ request }) => {
    const response = await request.get('/feed.xml')
    const body = await response.text()

    expect(body).toContain('<category>')
  })

  test('/feed.xml exposes the dc:creator namespace and value', async ({ request }) => {
    const response = await request.get('/feed.xml')
    const body = await response.text()

    expect(body).toMatch(/xmlns:dc=/)
    expect(body).toContain('<dc:creator>')
  })
})

test.describe('JSON Feed', () => {
  test('/feed.json responds with 200 and feed+json content-type', async ({ request }) => {
    const response = await request.get('/feed.json')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type'] ?? '').toMatch(/feed\+json/)
  })

  test('/feed.json declares JSON Feed 1.1 and includes posts', async ({ request }) => {
    const response = await request.get('/feed.json')
    const json = await response.json()

    expect(json.version).toBe('https://jsonfeed.org/version/1.1')
    expect(Array.isArray(json.items)).toBe(true)
    expect(json.items.length).toBeGreaterThan(0)
    expect(json.items[0]).toHaveProperty('id')
    expect(json.items[0]).toHaveProperty('url')
    expect(json.items[0]).toHaveProperty('date_published')
  })

  test('home page advertises the JSON feed via <link rel="alternate">', async ({ page }) => {
    await page.goto('/')
    const link = page.locator('link[rel="alternate"][type="application/feed+json"]')
    await expect(link).toHaveAttribute('href', '/feed.json')
  })
})
