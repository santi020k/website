import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''
  const heading = locale === 'es' ? 'Sigue una serie.' : 'Follow a series.'
  const guidance = locale === 'es' ?
    'Empieza por el artículo 1 o explora el recorrido completo de lectura.' :
    'Start with article 1, or explore the complete reading path.'

  for (const theme of ['light', 'dark'] as const) {
    test(`Blog Series reading caption stays readable and opens the catalog: ${locale}, ${theme}`, async ({ page, browserName }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`${prefix}/blog/#blog-series`)
      const caption = page.locator('[data-blog-series-caption]')
      const browse = caption.getByRole('link')
      const firstSeries = page.locator('[data-series-card-link]').first()

      await expect(caption.getByRole('heading', { level: 2 })).toHaveText(heading)
      await expect(caption.locator('p')).toHaveText(guidance)
      await expect(browse).toHaveAttribute('href', `${prefix}/blog/series/`)
      await expect(page.locator('[data-series-card]')).toHaveCount(3)
      expect(await caption.evaluate(element => {
        const posts = document.querySelector('#posts')

        return posts !== null && Boolean(posts.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
      })).toBe(true)

      for (const [width, size] of [[1440, 100], [768, 100], [390, 100], [320, 200]] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await page.evaluate(() => document.fonts.ready)
        const bounds = requireValue(await caption.boundingBox())
        const target = requireValue(await browse.boundingBox())

        expect(target.height).toBeGreaterThanOrEqual(44)
        expect(target.x).toBeGreaterThanOrEqual(bounds.x - 1)
        expect(target.x + target.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
        expect(await caption.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h2,p,[data-text-link-label]')].every(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].every(rect => (
              rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
            ))
          })
        })).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
      await expectNoUnexpectedAccessibilityViolations(page)
      await browse.focus()
      await expect(browse).toHaveCSS('outline-style', 'solid')
      await expect(browse).toHaveCSS('cursor', 'pointer')
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(firstSeries).toBeFocused()
      await browse.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/series/`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('[data-blog-series-caption]')).toHaveCount(0)
      await page.goto(`${prefix}/blog/2/`)
      await expect(page.locator('[data-blog-series-caption]')).toHaveCount(0)
    })
  }

  test.describe(`Blog Series reading caption without scripts: ${locale}`, () => {
    test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

    test('opens the localized series catalog', async ({ page }) => {
      await page.goto(`${prefix}/blog/#blog-series`)
      await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded')
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
      await page.locator('[data-blog-series-browse]').click()
      await expect(page).toHaveURL(`${prefix}/blog/series/`)
      await expect(page.locator('[data-series-card]')).toHaveCount(3)
    })
  })
}
