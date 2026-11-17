import { expect, test } from '@playwright/test'

for (const { savedTheme, blockedMethod, expectedStoredTheme } of [
  { savedTheme: 'dark', blockedMethod: null, expectedStoredTheme: 'santi020k-light' },
  { savedTheme: 'dark', blockedMethod: 'setItem', expectedStoredTheme: 'dark' },
  { savedTheme: 'santi020k-dark', blockedMethod: 'setItem', expectedStoredTheme: 'santi020k-dark' },
  { savedTheme: 'dark', blockedMethod: 'getItem', expectedStoredTheme: 'SecurityError' }
] as const) {
  test(`toggles ${savedTheme} before enhancement and after navigation with ${blockedMethod ?? 'available storage'}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await page.addInitScript(({ savedTheme, blockedMethod }) => {
      localStorage.setItem('lumen-theme', 'lumen-light')
      localStorage.setItem('theme', savedTheme)

      if (blockedMethod) {
        Storage.prototype[blockedMethod] = () => {
          throw new DOMException('Storage unavailable', 'SecurityError')
        }
      }

      document.addEventListener('ui:ready', () => {
        document.documentElement.setAttribute('data-test-theme-ready', 'true')
      }, { once: true })
    }, { savedTheme, blockedMethod })

    let releaseMotion: () => void = () => undefined
    let motionHeld = false
    const motionResponse = new Promise<void>(resolve => {
      releaseMotion = resolve
    })

    // Keep the initial controller batch pending without delaying the theme module.
    // The first click must work through Lumen's real lazy loading and replay path.
    await page.route('**/_astro/motion.*.js', async route => {
      motionHeld = true
      await motionResponse
      await route.continue()
    })

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect.poll(() => motionHeld).toBe(true)

      const root = page.locator('html')
      const toggle = page.locator('[data-theme-toggle-btn]')
      const chromeColor = page.locator('meta[name="theme-color"][media="all"]')

      await expect(root).toHaveAttribute('data-theme', 'santi020k-dark')
      await expect(toggle).not.toHaveAttribute('data-ui-bound', 'true')
      await toggle.click()
      await expect(root).toHaveAttribute('data-theme', 'santi020k-light')
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await expect(chromeColor).toHaveAttribute('content', 'hsl(257 64% 98%)')

      await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'About', exact: true }).click()
      await expect(page).toHaveURL(/\/about\/$/u)
      await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
      await expect(root).toHaveAttribute('data-theme', 'santi020k-light')

      // The loaded theme module binds this new control during the click, while the
      // unrelated motion module still holds the destination's controller batch.
      await expect(toggle).not.toHaveAttribute('data-ui-bound', 'true')
      await toggle.click()
      await expect(root).toHaveAttribute('data-theme', 'santi020k-dark')
      await expect(toggle).toHaveAttribute('aria-pressed', 'true')
      await expect(chromeColor).toHaveAttribute('content', 'hsl(258 41% 8%)')

      releaseMotion()
      await expect(root).toHaveAttribute('data-test-theme-ready', 'true')
      await expect(root).toHaveAttribute('data-theme', 'santi020k-dark')
      await toggle.focus()
      await page.keyboard.press('Enter')
      await expect(root).toHaveAttribute('data-theme', 'santi020k-light')
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await expect(toggle).toBeFocused()

      expect(await page.evaluate(() => {
        try {
          return localStorage.getItem('theme')
        } catch (error) {
          return error instanceof DOMException ? error.name : String(error)
        }
      })).toBe(expectedStoredTheme)
    } finally {
      releaseMotion()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })
}
