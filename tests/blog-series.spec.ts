/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Blog series index page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/series/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Blog Series/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display the stats panel', async ({ page }) => {
    await expect(page.getByRole('paragraph').filter({ hasText: 'Active series' })).toBeVisible()
    await expect(page.getByRole('paragraph').filter({ hasText: 'Posts grouped' })).toBeVisible()
    await expect(page.getByRole('paragraph').filter({ hasText: 'Roadmap tracks' })).toBeVisible()
  })

  test('should render at least one series card', async ({ page }) => {
    const seriesSection = page.getByRole('heading', { name: /Current series on the site/i })
    await expect(seriesSection).toBeVisible()
    const cards = page.locator('section').filter({ has: seriesSection }).locator('article')
    await expect(cards.first()).toBeVisible()
  })

  test('should link back to the blog index', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to blog/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', /^\/blog\/$/)
  })

  test('should link to the content calendar', async ({ page }) => {
    const calendarLink = page.getByRole('link', { name: /Content calendar/i }).first()
    await expect(calendarLink).toBeVisible()
    await expect(calendarLink).toHaveAttribute('href', /^\/blog\/content-calendar\/$/)
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('blog-series-index.png')
    })
  }
})
