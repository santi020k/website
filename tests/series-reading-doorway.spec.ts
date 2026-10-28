import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''

  for (const route of ['/blog/', '/blog/series/']) {
    for (const theme of ['light', 'dark'] as const) {
      test(`series reading doorway keeps distinct destinations: ${route}, ${locale}, ${theme}`, async ({ page, request, browserName }) => {
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto(`${prefix}${route}`)
        const cards = page.locator('[data-series-card]')

        await expect(cards).toHaveCount(3)
        await expect(cards.locator('a a')).toHaveCount(0)
        for (const card of await cards.all()) {
          await expect(card.getByRole('link')).toHaveCount(2)
          const first = card.locator('[data-series-card-start]')

          await expect(first.locator('[data-series-card-start-label]')).toHaveText(locale === 'es' ?
            'Empieza por el artículo 1' :
            'Start with article 1')
          expect((await request.get(requireValue(await first.getAttribute('href')))).status()).toBe(200)
          await expect(first.locator('[data-series-card-start-meta]')).toContainText(/min/u)
        }
        for (const [width, size] of [[1440, 100], [1024, 100], [768, 100], [390, 100], [320, 200]] as const) {
          await page.setViewportSize({ width, height: 1100 })
          await page.evaluate(value => {
            document.documentElement.style.fontSize = `${value}%`
          }, size)
          await page.evaluate(() => document.fonts.ready)
          const geometry = await cards.evaluateAll(elements => elements.map(card => {
            const bounds = card.getBoundingClientRect()
            const start = card.querySelector('[data-series-card-start]')?.getBoundingClientRect()
            const clipped = [...card.querySelectorAll('h3,p,li,[data-series-card-start-title],[data-series-card-start-label]')]
              .some(copy => {
                const range = document.createRange()

                range.selectNodeContents(copy)
                return [...range.getClientRects()].some(rect => (
                  rect.left < bounds.left - 1 || rect.right > bounds.right + 1
                ))
              })

            return { clipped, top: bounds.top, bottom: bounds.bottom, start: start?.top }
          }))

          expect(geometry.every(card => !card.clipped)).toBe(true)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
          for (const card of geometry) {
            const peers = geometry.filter(other => Math.abs(card.top - other.top) < 1)

            expect(peers.every(peer => Math.abs(requireValue(peer.start) - requireValue(card.start)) < 1)).toBe(true)
            expect(peers.every(peer => Math.abs(peer.bottom - card.bottom) < 1)).toBe(true)
          }
        }
        await expectNoUnexpectedAccessibilityViolations(page)
        const main = cards.first().locator('[data-series-card-link]')
        const first = cards.first().locator('[data-series-card-start]')
        const seriesPath = requireValue(await main.getAttribute('href'))
        const firstPath = requireValue(await first.getAttribute('href'))
        const firstTitle = await first.locator('[data-series-card-start-title]').innerText()

        await main.click()
        await expect(page).toHaveURL(seriesPath)
        await expect(page.locator('[data-series-entry-first]')).toHaveAttribute('href', firstPath)
        await expect(page.locator('[data-series-entry-first] h2')).toHaveText(firstTitle)
        await page.goto(`${prefix}${route}`)
        await main.focus()
        await expect(main).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
        await expect(first).toBeFocused()
        await expect(first).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(firstPath)
        await expect(page.getByRole('heading', { level: 1 })).toContainText(firstTitle)
      })
    }

    test.describe(`series reading doorway without scripts: ${route}, ${locale}`, () => {
      test.use({ javaScriptEnabled: false })

      test('opens article one directly', async ({ page }) => {
        await page.goto(`${prefix}${route}`)
        const first = page.locator('[data-series-card-start]').first()
        const destination = requireValue(await first.getAttribute('href'))

        await first.click()
        await expect(page).toHaveURL(destination)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      })
    })
  }
}
