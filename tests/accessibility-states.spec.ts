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

  test('theme toggle ignores a stale Lumen theme preference', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('theme-seeded') !== 'true') {
        localStorage.setItem('lumen-theme', 'lumen-light')
        localStorage.setItem('theme', 'dark')
        sessionStorage.setItem('theme-seeded', 'true')
      }
    })
    await page.goto('/')

    const root = page.locator('html')
    const toggle = page.getByRole('button', { name: 'Toggle color theme' })

    await expect(root).toHaveAttribute('data-theme', 'dark')
    await expect(root).toHaveClass(/dark/)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await toggle.click()

    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect(root).not.toHaveClass(/dark/)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await page.reload()

    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect(root).not.toHaveClass(/dark/)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  test('topic sort toggles keep one authoritative pressed state', async ({ page }) => {
    await page.goto('/blog/tags/')

    const byCount = page.getByRole('button', { name: 'By count' })
    const alphabetical = page.getByRole('button', { name: 'A → Z' })
    const topics = page.locator('#tags-list > [data-label]')

    await expect(byCount).toHaveAttribute('aria-pressed', 'true')
    await expect(alphabetical).toHaveAttribute('aria-pressed', 'false')

    await alphabetical.press('Enter')

    await expect(byCount).toHaveAttribute('aria-pressed', 'false')
    await expect(alphabetical).toHaveAttribute('aria-pressed', 'true')
    await expect(topics.first()).toHaveAttribute('data-label', 'accessibility')

    await alphabetical.press('Space')

    await expect(alphabetical).toHaveAttribute('aria-pressed', 'true')

    await byCount.click()

    await expect(byCount).toHaveAttribute('aria-pressed', 'true')
    await expect(alphabetical).toHaveAttribute('aria-pressed', 'false')
    await expect(topics.first()).toHaveAttribute('data-label', 'developer-experience')
  })
})
