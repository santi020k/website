import { expect, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const ARTICLE = '/blog/avoid-magic-strings-in-typescript-and-javascript/'

test.use({ hasTouch: true })

for (const width of [360, 375, 390, 430]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`article code controls retain a generous touch target at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: () => Promise.resolve() }
        })
      })
      await page.goto(ARTICLE)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('html')).toHaveCSS('font-size', '16px')

      const figures = page.locator('.prose-santi [data-ui-code]')

      expect(await figures.count()).toBeGreaterThan(0)
      for (const figure of await figures.all()) {
        const copy = figure.locator('[data-ui-code-copy]')
        const bounds = requireValue(await copy.boundingBox())

        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
        const figureBounds = requireValue(await figure.boundingBox())

        expect(bounds.x).toBeGreaterThanOrEqual(figureBounds.x)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(figureBounds.x + figureBounds.width)

        // A tap near the padded edge must activate the button, not only its glyph.
        await copy.tap({ position: { x: bounds.width - 3, y: bounds.height / 2 } })
        await expect(copy).toHaveAttribute('data-state', 'copied')
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  }
}
