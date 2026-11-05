import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark']) {
  for (const route of ['/', '/portfolio/lumen-ui/', '/portfolio/postlens/']) {
    test(`${route} discovery content reflows in ${theme} at enlarged text`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      const content = page.locator('[data-start-here], [data-product-previews]')
      await content.scrollIntoViewIfNeeded()
      const layout = await content.evaluate(element => ({
        width: element.clientWidth,
        contentWidth: element.scrollWidth,
        viewport: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth
      }))
      expect(layout.contentWidth).toBeLessThanOrEqual(layout.width)
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport)
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }
}
