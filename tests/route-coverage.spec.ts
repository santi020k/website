/* eslint func-style: off, jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function assertArray(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new Error('Expected payload to be an array')
}

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Expected payload item to be an object')
}

test.describe('Route coverage smoke tests', () => {
  test('/offline/ is reachable and renders fallback messaging', async ({ page, request }) => {
    const response = await request.get('/offline/')
    expect(response.status()).toBe(200)

    await page.goto('/offline/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('No connection,')
    await expect(page.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', /^\/$/)
  })

  test('/search-index.json returns searchable entries', async ({ request }) => {
    const response = await request.get('/search-index.json')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type'] ?? '').toContain('application/json')

    const payload: unknown = await response.json()
    expect(Array.isArray(payload)).toBe(true)
    assertArray(payload)
    expect(payload.length).toBeGreaterThan(0)

    const firstEntry = payload[0]
    assertRecord(firstEntry)
    expect(firstEntry).toEqual(
      expect.objectContaining({
        description: expect.any(String),
        path: expect.stringMatching(/^\/(blog|portfolio)\//),
        tags: expect.any(Array),
        title: expect.any(String),
        type: expect.stringMatching(/^(community|post|project)$/)
      })
    )
  })

  test('internal links stay in the same tab so View Transitions and history keep working', async ({ page }) => {
    const routes = ['/', '/about/', '/work/', '/projects/', '/blog/', '/speaking/', '/portfolio/', '/resume/']

    for (const route of routes) {
      await page.goto(route)

      const offenders = await page.locator('a[target="_blank"]').evaluateAll(
        links => links
          .map(link => link.getAttribute('href') ?? '')
          .filter(href => href.startsWith('/'))
          // Downloadable assets (the resume PDF) legitimately open in a new tab.
          .filter(href => !/\.[a-z0-9]+$/i.test(href))
      )

      expect(offenders, `${route} opens internal links in a new tab`).toEqual([])
    }
  })

  test('internal page links use trailing slashes across primary routes', async ({ page }) => {
    const routes = ['/', '/about/', '/work/', '/blog/', '/blog/2/', '/portfolio/', '/technologies/']

    for (const route of routes) {
      await page.goto(route)

      const offenders = await page.locator('a[href^="/"]').evaluateAll(
        links => links
          .map(link => (link.getAttribute('href') ?? '').split('#')[0]?.split('?')[0] ?? '')
          .filter(href => href.length > 1 && !href.endsWith('/'))
          // Asset routes (feeds, PDFs, images) are files, not pages.
          .filter(href => !/\.[a-z0-9]+$/i.test(href))
      )

      expect(offenders, `${route} links to a page without a trailing slash`).toEqual([])
    }
  })

  test('first topic link from /blog/tags/ resolves to a topic archive page', async ({ page }) => {
    await page.goto('/blog/tags/')

    const firstTopicLink = page.locator('#tags-list a[href^="/blog/tags/"]').first()
    await expect(firstTopicLink).toBeVisible()
    await expect(firstTopicLink).toHaveAttribute('href', /\/blog\/tags\/.+\/$/)
    await firstTopicLink.click()
    await expect(page).toHaveURL(/\/blog\/tags\/.+\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('first series link from /blog/series/ resolves to a series detail page', async ({ page }) => {
    await page.goto('/blog/series/')

    const firstSeriesLink = page.locator('a[href^="/blog/series/"]').first()
    await expect(firstSeriesLink).toBeVisible()
    await expect(firstSeriesLink).toHaveAttribute('href', /\/blog\/series\/[^/]+\/$/)
    await firstSeriesLink.click()
    await expect(page).toHaveURL(/\/blog\/series\/[^/]+\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('first technology filter link from /technologies/ resolves to a technology archive page', async ({ page }) => {
    await page.goto('/technologies/')

    const firstTechnologyLink = page.locator('a[href^="/technologies/"]').filter({
      hasNotText: 'Back to portfolio'
    }).first()
    await expect(firstTechnologyLink).toBeVisible()
    await expect(firstTechnologyLink).toHaveAttribute('href', /\/technologies\/[^/]+\/$/)
    await firstTechnologyLink.click()
    await expect(page).toHaveURL(/\/technologies\/[^/]+\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
