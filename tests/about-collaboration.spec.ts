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
        for (const [index, { title, description, fit, source }] of collaborationLanes.entries()) {
          const article = articles.nth(index)

          await expect(article.getByRole('heading', { level: 3 })).toHaveText(title)
          await expect(article.locator('h3 + p')).toHaveText(description)
          await expect(article.locator('.about-lane-fit')).toHaveText(fit)
          const link = article.getByRole('link', { name: source.label, exact: true })

          await expect(link).toHaveAttribute('href', source.href)
          await expect(link).not.toHaveAttribute('target', '_blank')
          await link.focus()
          await expect(link).toHaveCSS('outline-style', 'solid')
          expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
          const clipped = await article.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('p, h3, [data-about-lane-source]')].some(child => {
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

test.describe('Collaboration evidence without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('each practice link opens its case-study chapter with the keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    for (const { source } of collaborationLanes) {
      await page.goto('/about/')
      const link = page.locator('#about-collaboration').getByRole('link', { name: source.label, exact: true })

      await link.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(url => `${url.pathname}${url.hash}` === source.href)
      await expect(page.locator(new URL(source.href, page.url()).hash)).toBeVisible()
    }
  })
})
