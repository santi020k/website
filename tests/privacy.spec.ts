/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test.describe('Privacy page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/privacy/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Privacy/)
    await expect(page.getByRole('heading', { level: 1, name: /Privacy/i })).toBeVisible()
  })

  test('should mention hosting and theme storage', async ({ page }) => {
    await expect(page.getByText(/built with Astro/i)).toBeVisible()
    await expect(page.getByText(/Theme preference/i)).toBeVisible()
  })

  test('should not have unexpected accessibility violations', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
