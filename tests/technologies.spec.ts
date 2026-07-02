import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Technologies index page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/technologies/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Technology Index/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display the technologies count and most-used stat', async ({ page }) => {
    const main = page.locator('#main')
    await expect(main.getByText('Technologies', { exact: true })).toBeVisible()
    await expect(main.getByText('Most used', { exact: true })).toBeVisible()
  })

  test('should render technology group labels', async ({ page }) => {
    // At least the Core group should always be present given the real data
    await expect(page.getByText('Core', { exact: true })).toBeVisible()
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
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('technologies-index.png')
    })
  }
})
