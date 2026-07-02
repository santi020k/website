/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Uses page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/uses/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Uses/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should contain the key sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /What I reach for most often/i, level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Good tools disappear into the work/i, level: 2 })).toBeVisible()
  })

  test('should link to the portfolio', async ({ page }) => {
    const portfolioLink = page.getByRole('link', { name: /See the portfolio/i })
    await expect(portfolioLink).toBeVisible()
    await expect(portfolioLink).toHaveAttribute('href', /^\/portfolio\/$/)
  })

  test('should link to the speaking page', async ({ page }) => {
    const speakingLink = page.getByRole('link', { name: /Explore speaking/i })
    await expect(speakingLink).toBeVisible()
    await expect(speakingLink).toHaveAttribute('href', /^\/speaking\/$/)
  })

  test('should render at least one setup section article', async ({ page }) => {
    const setupHeading = page.getByRole('heading', { name: /What I reach for most often/i })
    await expect(setupHeading).toBeVisible()
    const setupSection = page.locator('section').filter({ has: setupHeading })
    await expect(setupSection.locator('[data-uses-section]').first()).toBeVisible()
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('uses-page.png')
    })
  }
})
