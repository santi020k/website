import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const slug of ['lumen-ui', 'postlens']) {
  test(`${slug} previews show complete screenshots and useful captions`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/portfolio/${slug}/`)
    const previews = page.getByRole('region', { name: 'Inside the product' })
    await expect(previews.locator('figure')).toHaveCount(2)
    await expect(page.getByRole('link', { name: 'Inside the product', exact: true })).toHaveAttribute('href', '#product-previews')

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const figure of await previews.locator('figure').all()) {
        await figure.scrollIntoViewIfNeeded()
        const image = figure.getByRole('img')
        await expect(image).toHaveAttribute('alt', /\S.{20}/u)
        await expect(image).toHaveAttribute('loading', 'lazy')
        await expect(image).toHaveCSS('object-fit', 'contain')
        await expect.poll(() => image.evaluate(element => {
          if (!(element instanceof HTMLImageElement)) return false

          return element.complete && element.naturalWidth > 0
        })).toBe(true)
        await expect(figure.locator('figcaption')).toBeVisible()
        const bounds = await figure.boundingBox()
        expect(bounds?.x).toBeGreaterThanOrEqual(0)
        expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
      }
    }

    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('projects without previews keep their existing reading navigation', async ({ page }) => {
  await page.goto('/portfolio/smith-commerce/')
  await expect(page.locator('[data-product-previews]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Inside the product', exact: true })).toHaveCount(0)
})

test('PostLens distinguishes development screens and generated samples from the store release', async ({ page }) => {
  await page.goto('/portfolio/postlens/')
  const previews = page.getByRole('region', { name: 'Inside the product' })
  await expect(previews).toContainText('PostLens 2.0 development preview')
  await expect(previews).toContainText('AI-generated sample photos; gallery scores are illustrative.')
  await expect(previews).toContainText('not the current App Store release')
})
