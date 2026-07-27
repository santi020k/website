/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

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

  test('should expose the error section through its heading', async ({ page }) => {
    const errorSection = page.locator('section[aria-labelledby="error-heading"]')

    await expect(errorSection).toBeVisible()
    await expect(errorSection.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'error-heading')
  })

  test('should provide navigation links back to key pages', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /Back home/i })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('href', /^\/$/)

    const portfolioLink = page.getByRole('link', { name: 'Portfolio' })
    await expect(portfolioLink.first()).toBeVisible()

    const blogLink = page.getByRole('link', { name: 'Blog' })
    await expect(blogLink.first()).toBeVisible()
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('not-found-page.png')
    })
  }
})
