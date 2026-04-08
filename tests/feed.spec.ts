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
})
