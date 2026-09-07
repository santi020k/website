import { expect, test } from '@playwright/test'

test.describe('Retired content calendar route', () => {
  test('redirects to the blog index', async ({ page }) => {
    await page.goto('/blog/content-calendar/')

    await expect(page).toHaveURL(/\/blog\/$/)
    await expect(page).toHaveTitle(/Personal Blog/)
  })
})
