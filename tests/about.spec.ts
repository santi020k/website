/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/About Santiago Molina/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should contain key sections', async ({ page }) => {
    await expect(page.locator('#main').getByText('About', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /What I believe about engineering/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /What collaborators say about the work/i })).toBeVisible()
  })

  test('should have working call-to-action links', async ({ page }) => {
    const portfolioLink = page.getByRole('link', { name: /See selected work/i })
    const blogLink = page.getByRole('link', { name: /Read the blog/i })

    await expect(portfolioLink).toBeVisible()
    await expect(portfolioLink).toHaveAttribute('href', /^\/portfolio\/$/)

    await expect(blogLink).toBeVisible()
    await expect(blogLink).toHaveAttribute('href', /^\/blog\/$/)
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page, [
      {
        htmlIncludes: 'href="/portfolio/"',
        id: 'color-contrast'
      }
    ])
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('about-page.png')
    })
  }
})
