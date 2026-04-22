import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

import { expect, test } from '@playwright/test'

const contactEmailLink = /hi@santi020k\.com/

test.describe('Accessibility statement page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accessibility/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Accessibility/)
    await expect(page.getByRole('heading', { level: 1, name: /Accessibility statement/i })).toBeVisible()
  })

  test('should state WCAG goal and reporting path', async ({ page }) => {
    await expect(page.getByText(/WCAG 2\.2 Level AA/i)).toBeVisible()
    const reportLink = page.locator('main article').getByRole('link', { name: contactEmailLink })
    await expect(reportLink).toHaveAttribute('href', /Accessibility%20issue/)
    await expect(reportLink).toBeVisible()
  })

  test('should not have unexpected accessibility violations', async ({ page }) => {
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
