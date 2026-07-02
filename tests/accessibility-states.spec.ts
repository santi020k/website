/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test.describe('Accessibility states', () => {
  test('homepage passes a11y when mobile navigation is open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const menuToggle = page.locator('[data-mobile-nav-toggle]')
    await menuToggle.click()
    await expect(menuToggle).toHaveAttribute('aria-expanded', /^true$/)
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('homepage passes a11y in dark theme', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('switch', { name: 'Toggle color theme' }).click()

    await expect(page.locator('html')).toHaveAttribute('data-theme', /dark|light/)
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
