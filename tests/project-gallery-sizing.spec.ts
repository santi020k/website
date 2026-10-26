import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'

const getVisibleBounds = async (locator: Locator) => {
  await expect(locator).toBeVisible()
  return locator.evaluate(element => {
    const { x, y, width, height } = element.getBoundingClientRect()
    return { x, y, width, height }
  })
}

for (const route of ['/technologies/react-js/', '/projects/']) {
  for (const { width, fontSize } of [
    { width: 375, fontSize: '100%' },
    { width: 767, fontSize: '100%' },
    { width: 900, fontSize: '200%' }
  ]) {
    test(`stacked project images fill their cards on ${route} at ${width}px with ${fontSize} text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await page.evaluate(size => {
        document.documentElement.style.fontSize = size
      }, fontSize)

      const cards = page.locator('[data-project-gallery-card]')

      expect(await cards.count()).toBeGreaterThan(1)
      for (const card of await cards.all()) {
        const cardBox = await getVisibleBounds(card)
        const imageBox = await getVisibleBounds(card.locator('.projects-editorial-image'))
        const copyBox = await getVisibleBounds(card.locator('.projects-editorial-copy'))

        expect(imageBox.x).toBeCloseTo(cardBox.x, 0)
        expect(imageBox.width).toBeCloseTo(cardBox.width, 0)
        expect(copyBox.x).toBeCloseTo(cardBox.x, 0)
        expect(copyBox.width).toBeCloseTo(cardBox.width, 0)
        expect(imageBox.width / imageBox.height).toBeCloseTo(16 / 10, 2)
        expect(copyBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    })
  }

  test(`featured project keeps its horizontal composition on ${route} at desktop widths`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route)

    const card = page.locator('[data-project-gallery-card]').first()
    const imageBox = await getVisibleBounds(card.locator('.projects-editorial-image'))
    const copyBox = await getVisibleBounds(card.locator('.projects-editorial-copy'))

    expect(imageBox.width / imageBox.height).toBeCloseTo(16 / 9, 2)
    expect(copyBox.x).toBeGreaterThan(imageBox.x + imageBox.width)
    expect(copyBox.y).toBeLessThan(imageBox.y + imageBox.height)
  })
}
