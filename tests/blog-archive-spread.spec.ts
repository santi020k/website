import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { waitForFonts } from './helpers/rendering'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''
  const pageLabel = locale === 'es' ? 'Página' : 'Page'
  const articlesLabel = locale === 'es' ? 'artículos' : 'articles'
  const countCaption = locale === 'es' ? 'En esta página' : 'On this page'

  for (const number of [2, 4]) {
    test(`Archive spread describes the displayed articles: ${locale}, page ${number}`, async ({ page }) => {
      await page.goto(`${prefix}/blog/${number}/`)
      const hero = page.locator('[data-blog-archive-spread]')
      const count = await page.locator('#posts [data-post-gallery-card]').count()

      expect(count).toBeGreaterThan(0)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(hero.getByRole('heading', { level: 1 })).toContainText(`${pageLabel} ${number}.`)
      await expect(hero.locator('[data-archive-count] strong')).toHaveText(`${count} ${articlesLabel}`)
      await expect(hero.locator('[data-archive-count] span')).toHaveText(countCaption)
      await expect(hero.getByRole('link')).toHaveCount(2)
      await expect(hero.getByRole('link').first()).toHaveAttribute('href', `${prefix}/blog/`)
      await expect(hero.getByRole('link').last()).toHaveAttribute('href', `${prefix}/blog/tags/`)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://santi020k.com${prefix}/blog/${number}/`)
      await expect(page).toHaveTitle(new RegExp(`${pageLabel} ${number} `))
    })
  }

  test(`Archive spread reflows and retains keyboard destinations: ${locale}`, async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${prefix}/blog/2/`)
    const hero = page.locator('[data-blog-archive-spread]')

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)
      for (const [width, size] of [[1440, 100], [768, 100], [390, 100], [320, 200]] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        expect(await hero.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h1, p, a')].every(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].every(rect => (
              rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
            ))
          })
        })).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
      await page.setViewportSize({ width: 1440, height: 1100 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '100%'
      })
      await expectNoUnexpectedAccessibilityViolations(page)
    }
    const first = hero.getByRole('link').first()
    const last = hero.getByRole('link').last()

    await first.focus()
    await expect(first).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press({ chromium: 'Tab', firefox: 'Tab', webkit: 'Alt+Tab' }[browserName])
    await expect(last).toBeFocused()
    await expect(last).toHaveCSS('outline-style', 'solid')
    await last.press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/tags/`)
  })

  test.describe(`Archive spread without JavaScript: ${locale}`, () => {
    test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

    test('returns to the distinct first-page opening', async ({ page }) => {
      await page.goto(`${prefix}/blog/2/`)
      const hero = page.locator('[data-blog-archive-spread]')

      await expect(hero.locator('[data-archive-count]')).toBeVisible()
      await waitForFonts(page)
      await hero.getByRole('link').first().click()
      await expect(page).toHaveURL(`${prefix}/blog/`)
      await expect(page.locator('[data-blog-archive-spread]')).toHaveCount(0)
      await expect(page.locator('[data-blog-hero]')).toBeVisible()
    })
  })
}
