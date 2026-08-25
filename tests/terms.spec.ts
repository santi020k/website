/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test.describe('Terms and conditions page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terms/')
  })

  test('has the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Terms & Conditions/)
    await expect(
      page.getByRole('heading', { level: 1, name: /Terms & Conditions/i })
    ).toBeVisible()
  })

  test('explains use, intellectual property, and governing law', async ({ page }) => {
    await expect(page.getByText(/use it lawfully/i)).toBeVisible()
    await expect(page.getByText(/Intellectual property/i)).toBeVisible()
    await expect(page.getByText(/laws of the Republic of Colombia/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /hi@santi020k\.com/i })).toHaveAttribute(
      'href', /Terms%20and%20permissions/
    )
  })

  test('has no unexpected accessibility violations', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
