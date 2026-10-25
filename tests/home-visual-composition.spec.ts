import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Homepage product compositions in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('product images stay caption-free with accessible native destinations', async ({ page }) => {
      await page.goto('/')
      const products = page.locator('[data-home-product]')

      await expect(products).toHaveCount(2)
      for (const product of await products.all()) {
        await expect(product.locator('a')).toHaveCount(1)
        await expect(product.locator('button, input, select, [tabindex="0"]')).toHaveCount(0)
        const preview = product.locator('[data-product-preview]')

        await expect(preview.locator('img')).toHaveCount(2)
        await expect(preview).toHaveText('')
        await preview.scrollIntoViewIfNeeded()
        for (const image of await preview.locator('img').all()) {
          await expect(image).toHaveAttribute('alt', /\S/u)
          await expect.poll(() => image.evaluate(
            element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
          )).toBe(true)
        }
        const link = product.locator('a')
        const href = await link.getAttribute('href')

        expect(href).toMatch(/^\/portfolio\/.+\/$/u)
        await link.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(href ?? '')
        await expect(page.locator('[data-product-previews]')).toContainText(/illustrative|development/u)
        await page.goBack()
      }
    })

    test('work hierarchy and product artwork reflow without clipped copy', async ({ page }) => {
      const layouts = [[1440, 100], [768, 100], [375, 100], [320, 100], [375, 200], [1440, 200]] as const

      for (const [width, textSize] of layouts) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/')
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)

        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const work = page.locator('[data-home-showcase="work"]')

        await expect(work.locator('[data-featured-work]')).toHaveCount(1)
        await expect(work.locator('[data-home-supporting-project]')).toHaveCount(3)
        await expect(work.locator('[data-supporting-mark] img')).toHaveCount(3)
        await expect(work.locator('[data-supporting-evidence]')).toHaveCount(3)
        const copy = '[data-home-showcase] article :is(h3, p), [data-supporting-action], [data-product-action]'
        const clipped = await page.locator(copy).evaluateAll(elements => elements.flatMap(element => {
          const card = element.closest('article')?.getBoundingClientRect()
          const range = document.createRange()
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          const rectangles: DOMRect[] = []

          while (walker.nextNode()) {
            const node = walker.currentNode

            if (node.parentElement?.closest('.sr-only')) continue
            range.selectNodeContents(node)
            rectangles.push(...range.getClientRects())
          }
          const outside = !card || rectangles.some(rect => {
            const crossesEdge = rect.left < card.left - 1 || rect.right > card.right + 1

            return rect.width > 0 && crossesEdge
          })

          return outside ? [element.textContent] : []
        }))

        expect(clipped, `${width}px at ${textSize}% text`).toEqual([])
        await expectNoUnexpectedAccessibilityViolations(page)
      }
    })
  })
}

test('product previews and links remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } })
  const page = await context.newPage()

  await page.goto('/')
  const images = page.locator('[data-product-preview] img')

  await expect(images).toHaveCount(4)
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect(image).toBeVisible()
    await expect.poll(() => image.evaluate(
      element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
    )).toBe(true)
  }
  const product = page.locator('[data-home-product] a').first()

  await product.click()
  await expect(page).toHaveURL(/\/portfolio\/lumen-ui\/$/u)
  await context.close()
})
