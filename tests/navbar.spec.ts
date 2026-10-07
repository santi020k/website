import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const width of [320, 375, 390, 768, 1024, 1280, 1440]) {
  for (const fontSize of ['16px', '20px']) {
    test(`header controls fit at ${width}px with ${fontSize} text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.evaluate(size => {
        document.documentElement.style.fontSize = size
      }, fontSize)
      await expect(page.locator('html')).toHaveCSS('font-size', fontSize)

      const geometry = await page.locator('[data-header-shell]').evaluate(shell => {
        const bounds = shell.getBoundingClientRect()
        const controls = [...shell.querySelectorAll('a, button')]
          .filter(element => element.getClientRects().length > 0)
          .map(element => {
            const rect = element.getBoundingClientRect()

            return { left: rect.left, right: rect.right, height: rect.height, width: rect.width }
          })

        return { left: bounds.left, right: bounds.right, controls }
      })

      for (const [index, control] of geometry.controls.entries()) {
        expect(control.left).toBeGreaterThanOrEqual(geometry.left)
        expect(control.right).toBeLessThanOrEqual(geometry.right)
        expect(control.height).toBeGreaterThanOrEqual(44)
        expect(control.width).toBeGreaterThanOrEqual(44)

        const previous = geometry.controls[index - 1]

        if (previous) expect(control.left).toBeGreaterThanOrEqual(previous.right)
      }
    })
  }
}

for (const theme of ['light', 'dark']) {
  test(`desktop navigation is accessible and marks the current route in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(selectedTheme => {
      localStorage.setItem('theme', selectedTheme)
    }, theme)
    await page.goto('/about/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    const navigation = page.locator('.site-desktop-nav')

    await expect(navigation.locator('a[href="/about/"]')).toHaveAttribute('aria-current', 'page')
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1)

    const results = await new AxeBuilder({ page }).include('header').analyze()

    expect(results.violations).toEqual([])
  })
}

test('the open menu keeps header utilities and close reachable by keyboard', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const toggle = page.locator('[data-mobile-nav-toggle]')
  const firstLink = page.locator('[data-mobile-nav-link]').first()
  const previousKey = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'

  await toggle.press('Enter')
  await expect(firstLink).toBeFocused()

  const nextKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'

  for (const link of await page.locator('[data-mobile-nav-link]').all()) {
    await expect(link).toBeFocused()
    await page.keyboard.press(nextKey)
  }

  await expect(page.locator('[data-mobile-nav-actions] a').first()).toBeFocused()
  await page.keyboard.press(nextKey)
  await expect(page.locator('[data-mobile-nav-actions] a').last()).toBeFocused()
  await page.keyboard.press(nextKey)
  await expect(page.locator('.site-header-brand')).toBeFocused()
  await firstLink.focus()
  await page.keyboard.press(previousKey)
  await expect(toggle).toBeFocused()
  await page.keyboard.press(previousKey)
  await expect(page.locator('[data-theme-toggle-btn]')).toBeFocused()
  await page.keyboard.press(previousKey)
  await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#site-search-input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(toggle).toBeFocused()
})

test('the menu follows the dock after scrolling and closes on desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => {
    window.scrollTo(0, 500)
  })
  await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')
  await page.locator('[data-mobile-nav-toggle]').click()

  const shell = await page.locator('[data-header-shell]').boundingBox()
  const panel = await page.locator('[data-mobile-nav-panel]').boundingBox()

  if (!shell || !panel) throw new Error('Navigation has no rendered bounds')

  expect(Math.abs(panel.y - (shell.y + shell.height))).toBeLessThanOrEqual(1)
  expect(panel.x).toBe(shell.x)
  expect(panel.width).toBe(shell.width)

  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(page.locator('.site-desktop-nav')).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/mobile-nav-open/)
})
