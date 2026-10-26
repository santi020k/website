import AxeBuilder from '@axe-core/playwright'
import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'

const updatedArticle = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'

const visibleBounds = async (locator: Locator) => {
  const bounds = await locator.boundingBox()

  if (!bounds) throw new Error('Publication details must be visible')

  return bounds
}

for (const theme of ['light', 'dark'] as const) {
  test(`reading imprint groups dates and reading details in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
    await page.route('https://giscus.app/**', route => route.abort())
    await page.goto(updatedArticle)
    await page.evaluate(scheme => {
      document.documentElement.dataset.theme = scheme
    }, theme)
    await page.evaluate(() => document.fonts.ready)

    const imprint = page.locator('[data-publication-imprint]')
    const dates = imprint.locator('[data-publication-dates]')
    const reading = imprint.locator('[data-publication-reading]')

    await expect(dates.locator('time')).toHaveText(['Jun 12, 2026', 'Jul 28, 2026'])
    await expect(dates.locator('time').first()).toHaveAttribute('datetime', '2026-06-12T15:00:00.000Z')
    await expect(dates.locator('time').last()).toHaveAttribute('datetime', '2026-07-28T00:00:00.000Z')
    await expect(reading.locator('dd')).toHaveText(['6 min read', '1,155 words'])

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      const dateBounds = await visibleBounds(dates)
      const readingBounds = await visibleBounds(reading)

      expect(Math.abs(dateBounds.y - readingBounds.y)).toBeLessThan(1)
      expect(readingBounds.x).toBeGreaterThan(dateBounds.x + dateBounds.width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }

    await page.setViewportSize({ width: 390, height: 1000 })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    const dateBounds = await visibleBounds(dates)
    const readingBounds = await visibleBounds(reading)

    expect(readingBounds.y).toBeGreaterThan(dateBounds.y + dateBounds.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    const accessibility = await new AxeBuilder({ page }).include('[data-publication-imprint]').analyze()

    expect(accessibility.violations).toEqual([])
  })
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  test('reading imprint omits a missing update date', async ({ page }) => {
    await page.goto('/blog/why-i-moved-to-zed/')
    const imprint = page.locator('[data-publication-imprint]')

    await expect(imprint.locator('[data-publication-field="updated"]')).toHaveCount(0)
    await expect(imprint.locator('[data-publication-dates] time')).toBeVisible()
    await expect(imprint.locator('[data-publication-reading]')).toContainText('min read')
    await expect(imprint.locator('[data-publication-reading]')).toContainText('words')
  })
})
