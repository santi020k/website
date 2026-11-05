import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test(`homepage statistics keep values and descriptions readable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const textSize of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/')
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)

        const stats = page.getByRole('region', { name: 'Experience and impact' })
        const cards = stats.getByRole('article')

        await expect(cards).toHaveCount(4)
        await expect(cards.locator('[data-slot="stat-label"]')).toHaveText([
          'Years building', 'People, one team', 'Release cycle time', 'People learning together'
        ])
        await expect(cards.locator('[data-ui-animated-number-output]')).toHaveText(['12+', '14', '-75%', '100+'])
        await expect(cards.locator('[data-ui-animated-number] .ui-sr-only')).toHaveText(['12+', '14', '-75%', '100+'])
        await expect(cards.locator('p')).toHaveText([
          'Across web, mobile, and the systems behind them.',
          'The largest cross-functional team I’ve led.',
          'Through better pipelines and automated quality gates.',
          'Typical attendance at our community events.'
        ])
        for (const card of await cards.all()) {
          const clipped = await card.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('[data-slot="stat-label"], [data-ui-animated-number-output], p')]
              .some(child => {
                const range = document.createRange()

                range.selectNodeContents(child)
                return [...range.getClientRects()].some(rect => rect.width > 0 && (
                  rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
                ))
              })
          })

          expect(clipped, `Statistic content at ${width}px and ${textSize}% must fit`).toBe(false)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
