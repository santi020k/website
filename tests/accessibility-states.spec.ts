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

  test('theme toggle updates and persists its visual and accessible state', async ({ page }) => {
    await page.goto('/')

    const root = page.locator('html')
    const toggle = page.getByRole('button', { name: 'Toggle color theme' })
    const initialTheme = await root.getAttribute('data-theme')
    const nextTheme = initialTheme === 'dark' ? 'light' : 'dark'

    await toggle.click()

    await expect(root).toHaveAttribute('data-theme', nextTheme)
    await expect(toggle).toHaveAttribute('aria-pressed', String(nextTheme === 'dark'))
    await page.reload()
    await expect(root).toHaveAttribute('data-theme', nextTheme)
    await expect(toggle).toHaveAttribute('aria-pressed', String(nextTheme === 'dark'))
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
