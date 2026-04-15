import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

import { expect, test } from '@playwright/test'

test.describe('404 page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/this-page-does-not-exist/', { waitUntil: 'domcontentloaded' })
  })

  test('should return a 404 status code', async ({ request }) => {
    const response = await request.get('/this-page-does-not-exist/')
    expect(response.status()).toBe(404)
  })

  test('should show the 404 heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('orbit')
  })

  test('should use role="alert" on the error section', async ({ page }) => {
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('should provide navigation links back to key pages', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /Back home/i })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('href', '/')

    const portfolioLink = page.getByRole('link', { name: 'Portfolio' })
    await expect(portfolioLink.first()).toBeVisible()

    const blogLink = page.getByRole('link', { name: 'Blog' })
    await expect(blogLink.first()).toBeVisible()
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
