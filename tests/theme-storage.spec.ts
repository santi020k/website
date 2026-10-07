import { expect, test } from '@playwright/test'

for (const blockedMethod of ['getItem', 'setItem'] as const) {
  test(`preserves the selected theme across navigation when ${blockedMethod} is blocked`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.addInitScript(method => {
      // A failed write can leave an older saved preference behind.
      if (method === 'setItem') localStorage.setItem('theme', 'light')

      Storage.prototype[method] = () => {
        throw new DOMException('Storage unavailable', 'SecurityError')
      }
    }, blockedMethod)
    await page.goto('/')

    const root = page.locator('html')
    const toggle = page.locator('[data-theme-toggle-btn]')

    await expect(root).toHaveAttribute('data-theme', 'light')
    await toggle.click()
    await expect(root).toHaveAttribute('data-theme', 'dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/)
    await expect(root).toHaveAttribute('data-theme', 'dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(root).toHaveAttribute('data-theme', 'dark')

    await toggle.click()
    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await page.goBack()
    await expect(page).toHaveURL('/')
    await expect(root).toHaveAttribute('data-theme', 'light')
  })
}

test('follows system theme changes when no explicit choice exists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
