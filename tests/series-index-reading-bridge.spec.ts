import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''
  const destinations = [`${prefix}/blog/`, `${prefix}/blog/tags/`] as const

  for (const theme of ['light', 'dark'] as const) {
    test(`Series index reading bridge keeps both routes readable and usable: ${locale}, ${theme}`, async ({ page, browserName }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`${prefix}/blog/series/`)
      const bridge = page.locator('[data-series-index-bridge]')
      const links = bridge.getByRole('link')

      await expect(bridge.getByRole('heading', { level: 2 })).toHaveText(locale === 'es' ?
        'Encuentra tu próxima lectura.' :
        'Find your next read.')
      await expect(bridge.getByRole('navigation', { name: locale === 'es' ? 'Más lecturas' : 'More writing' })).toBeVisible()
      expect(await links.evaluateAll(items => items.map(item => item.getAttribute('href')))).toEqual(destinations)
      await expect(links.nth(0)).toContainText(locale === 'es' ?
        'Guías, tutoriales y notas de campo' :
        'Guides, tutorials, and field notes')
      await expect(links.nth(1)).toContainText(locale === 'es' ? 'Explora algo que te interese' : 'Follow a particular interest')
      await expect(bridge.locator('a a')).toHaveCount(0)

      const layouts = [[1440, 100, false], [768, 100, false], [390, 100, true], [320, 200, true]] as const

      for (const [width, size, stacked] of layouts) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        const bounds = requireValue(await bridge.boundingBox())
        const lastCard = requireValue(await page.locator('[data-series-card]').last().boundingBox())
        const footer = requireValue(await page.locator('#footer-heading').boundingBox())
        const first = requireValue(await links.nth(0).boundingBox())
        const second = requireValue(await links.nth(1).boundingBox())

        expect(bounds.y).toBeGreaterThan(lastCard.y + lastCard.height)
        expect(footer.y).toBeGreaterThan(bounds.y + bounds.height)
        expect(second.y >= first.y + first.height - 1).toBe(stacked)
        expect(first.height).toBeGreaterThanOrEqual(44)
        expect(second.height).toBeGreaterThanOrEqual(44)
        expect(await bridge.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h2,p,a')].every(copy => {
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
      for (const link of await links.all()) {
        await link.focus()
        await expect(link).toHaveCSS('outline-style', 'solid')
        await expect(link).toHaveCSS('cursor', 'pointer')
      }
      await links.nth(0).focus()
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(links.nth(1)).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(destinations[1])
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }

  test.describe(`Series index reading bridge without scripts: ${locale}`, () => {
    test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

    test('opens both localized reading destinations', async ({ page }) => {
      for (const [index, destination] of destinations.entries()) {
        await page.goto(`${prefix}/blog/series/#series-index-bridge`)
        await page.evaluate(() => document.fonts.ready)
        await page.locator('[data-series-index-bridge]').getByRole('link').nth(index).click()
        await expect(page).toHaveURL(destination)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      }
    })
  })
}
