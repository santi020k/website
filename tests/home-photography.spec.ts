import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  for (const locale of ['en', 'es'] as const) {
    const prefix = locale === 'es' ? '/es' : ''

    test(`personal photography loads and stays readable in ${locale}, ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

      for (const [width, textSize] of [[390, 100], [1440, 100], [390, 200], [1440, 200]] as const) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto(`${prefix}/`)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)

        const life = page.locator('[data-home-life]')

        await expect(life.getByRole('heading', { level: 2 })).toHaveText(locale === 'es' ?
          'Un poco de vida entre líneas.' :
          'A little life between the lines.')
        const photographs = page.locator('[data-home-photo] img, [data-home-life] img')

        await expect(photographs).toHaveCount(4)
        for (const photograph of await photographs.all()) {
          await photograph.scrollIntoViewIfNeeded()
          await expect(photograph).toHaveAttribute('alt', /\S/u)
          await expect(photograph).toHaveAttribute('srcset', /\S/u)
          await expect.poll(() => photograph.evaluate(image => (
            image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
          ))).toBe(true)
        }
        const clipped = await life.locator('figcaption').evaluateAll(captions => captions.some(caption => (
          caption.scrollWidth > caption.clientWidth + 1
        )))

        expect(clipped).toBe(false)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const travel = life.getByRole('link', { name: locale === 'es' ? 'Explora mis viajes' : 'Explore my travels' })

        await expect(travel).toHaveAttribute('href', `${prefix}/travel/`)
        await expect(life.locator(`a[href="${prefix}/about/"]`)).toBeVisible()
        await travel.focus()
        await expect(travel).toBeInViewport()
        await expect(travel).toHaveCSS('outline-style', 'solid')
      }
      await expectNoUnexpectedAccessibilityViolations(page)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${prefix}/travel/`)
    })
  }
}
