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
    await expect(page.getByText(/aggregate traffic metrics/i)).toBeVisible()
    await expect(page.getByText(/without cookies, local storage, or fingerprinting/i)).toBeVisible()
  })

  test('should disclose that reaction avatars load from external hosts', async ({ page }) => {
    await expect(
      page.getByText(/profile pictures load directly from Webmention\.io or the author’s site/i)
    ).toBeVisible()
    await expect(page.getByText(/receives your IP address/i)).toBeVisible()
  })

  test('should not have unexpected accessibility violations', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
