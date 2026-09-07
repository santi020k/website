import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    test(`mobile menu stays readable and reachable at ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.evaluate(selectedTheme => {
        document.documentElement.dataset.theme = selectedTheme
        document.documentElement.style.fontSize = '20px'
      }, theme)
      await page.locator('[data-mobile-nav-toggle]').click()

      const surface = page.locator('[data-mobile-nav-surface]')
      const bounds = await surface.boundingBox()

      expect(bounds).not.toBeNull()

      if (!bounds) throw new Error('Menu surface has no layout bounds')

      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height)
      expect(await surface.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      expect(await surface.evaluate(element => getComputedStyle(element).backgroundColor)).toMatch(/^rgb\(/)

      const resume = page.locator('#mobile-nav').getByRole('link', { name: 'Resume' })

      await resume.scrollIntoViewIfNeeded()
      await expect(resume).toBeInViewport({ ratio: 1 })
      await page.keyboard.press('Escape')
      await expect(surface).toBeHidden()
      await expect(page.locator('[data-mobile-nav-toggle]')).toBeFocused()
    })
  }

  test(`mobile menu accessibility in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(selectedTheme => {
      document.documentElement.dataset.theme = selectedTheme
    }, theme)
    await page.locator('[data-mobile-nav-toggle]').click()

    const results = await new AxeBuilder({ page }).include('#mobile-nav').analyze()

    expect(results.violations).toEqual([])
  })
}
