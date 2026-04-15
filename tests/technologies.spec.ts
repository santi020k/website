import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

import { expect, test } from '@playwright/test'

test.describe('Technologies index page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/technologies/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Technology Index/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display the technologies count and most-used stat', async ({ page }) => {
    await expect(page.getByText('Technologies')).toBeVisible()
    await expect(page.getByText('Most used')).toBeVisible()
  })

  test('should render technology group labels', async ({ page }) => {
    // At least the Core group should always be present given the real data
    await expect(page.getByText('Core')).toBeVisible()
  })

  test('should render technology pill links', async ({ page }) => {
    const techLinks = page.getByRole('link').filter({ hasText: /.+/ })
    // Expect more than just the navigation links — technology pills add many more
    await expect(techLinks).toHaveCount(await techLinks.count())
    expect(await techLinks.count()).toBeGreaterThan(5)
  })

  test('should link back to the portfolio', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to portfolio/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/portfolio/')
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
