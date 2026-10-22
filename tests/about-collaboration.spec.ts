import { expect, test } from '@playwright/test'

import { collaborationLanes } from '../src/data/profile'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test(`collaboration copy stays readable at narrow widths and enlarged text in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const textSize of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/about/')
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)

        const articles = page.locator('#about-collaboration').getByRole('article')

        await expect(articles).toHaveCount(collaborationLanes.length)
        for (const [index, { title, description, fit }] of collaborationLanes.entries()) {
          const article = articles.nth(index)

          await expect(article.getByRole('heading', { level: 3 })).toHaveText(title)
          await expect(article.locator('h3 + p')).toHaveText(description)
          await expect(article.locator('.about-lane-fit')).toHaveText(fit)
          const clipped = await article.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('p, h3')].some(child => {
              const range = document.createRange()

              range.selectNodeContents(child)
              return [...range.getClientRects()].some(rect => rect.width > 0 && (
                rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
              ))
            })
          })

          expect(clipped, `Collaboration ${index + 1} at ${width}px and ${textSize}% must fit`).toBe(false)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
