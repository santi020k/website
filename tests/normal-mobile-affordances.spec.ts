import { expect, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const ARTICLE = '/blog/avoid-magic-strings-in-typescript-and-javascript/'

test.use({ hasTouch: true })

for (const width of [360, 375, 390, 430, 1440]) {
  for (const fontSize of ['100%', '200%']) {
    for (const theme of ['light', 'dark'] as const) {
      test(`article code controls retain a generous touch target at ${width}px with ${fontSize} text in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 })
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: () => Promise.resolve() }
          })
        })
        await page.goto(ARTICLE)
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, fontSize)
        await page.evaluate(() => document.fonts.ready)
        await expect(page.locator('html')).toHaveCSS('font-size', `${16 * parseFloat(fontSize) / 100}px`)

        const figures = page.locator('.prose-santi [data-ui-code]')

        expect(await figures.count()).toBeGreaterThan(0)
        for (const figure of await figures.all()) {
          const caption = figure.locator('figcaption')

          await expect(caption).toHaveCSS('margin-top', '0px')
          await expect(caption).toHaveCSS('margin-bottom', '0px')
          const gap = await figure.evaluate(element => {
            const header = element.querySelector('figcaption')

            const headerTop = header?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
            const border = parseFloat(getComputedStyle(element).borderTopWidth)

            return headerTop - element.getBoundingClientRect().top - border
          })

          expect(Math.abs(gap)).toBeLessThanOrEqual(1)
          const copy = figure.locator('[data-ui-code-copy]')

          // Center the control clear of the floating Top action before measuring its edge.
          await copy.evaluate(element => {
            element.scrollIntoView({ block: 'center' })
          })
          await copy.scrollIntoViewIfNeeded()
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
}
