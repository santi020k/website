import { expect, test } from '@playwright/test'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const assertArray = (value: unknown): asserts value is unknown[] => {
  if (!Array.isArray(value)) throw new Error('Expected payload to be an array')
}

const assertRecord = (value: unknown): asserts value is Record<string, unknown> => {
  if (!isRecord(value)) throw new Error('Expected payload item to be an object')
}

test.describe('Route coverage smoke tests', () => {
  test('/offline/ is reachable and renders fallback messaging', async ({ page, request }) => {
    const response = await request.get('/offline/')
    expect(response.status()).toBe(200)

    await page.goto('/offline/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('You are offline')
    await expect(page.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/')
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
        type: expect.stringMatching(/^(post|project)$/)
      })
    )
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
