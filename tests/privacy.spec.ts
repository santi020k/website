import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

import { expect, test } from '@playwright/test'

test.describe('Privacy page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/privacy/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Privacy/)
    await expect(page.getByRole('heading', { level: 1, name: /Privacy & analytics/i })).toBeVisible()
  })

  test('should mention hosting and theme storage', async ({ page }) => {
    await expect(page.getByText(/built with Astro/i)).toBeVisible()
    await expect(page.getByText(/Theme preference/i)).toBeVisible()
  })

  test('should not have unexpected accessibility violations', async ({ page }) => {
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
