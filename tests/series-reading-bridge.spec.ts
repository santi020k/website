import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

const slugs = ['building-a-production-nextjs-app', 'eslint-in-practice', 'the-santi020k-way']

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''

  for (const slug of slugs) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${locale} ${slug} closes with localized reading destinations in ${theme}`, async ({ browserName, page }) => {
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto(`${prefix}/blog/series/${slug}/`)
        const bridge = page.locator('[data-series-reading-bridge]')
        const links = bridge.getByRole('link')

        await expect(bridge.getByRole('heading', { level: 2 })).toHaveText(locale === 'es' ? 'Encuentra tu próxima lectura.' : 'Find your next read.')
        await expect(bridge.getByRole('navigation', { name: locale === 'es' ? 'Más lecturas' : 'More writing' })).toBeVisible()
        await expect(links).toHaveCount(2)
        expect(await links.evaluateAll(items => items.map(item => item.getAttribute('href')))).toEqual([`${prefix}/blog/series/`, `${prefix}/blog/`])
        await expect(links.nth(0)).toContainText(locale === 'es' ? 'Explora todas las series' : 'Explore all series')
        await expect(links.nth(1)).toContainText(locale === 'es' ? 'Explora el Blog' : 'Browse the Blog')

        const layouts = [[1440, 100, false], [768, 100, false], [390, 100, true], [320, 200, true]] as const

        for (const [width, textSize, stacked] of layouts) {
          await page.setViewportSize({ width, height: 1100 })
          await page.evaluate(async size => {
            document.documentElement.style.fontSize = `${size}%`
            await document.fonts.ready
          }, textSize)
          const box = requireValue(await bridge.boundingBox())
          const last = requireValue(await page.locator('[data-post-gallery-card]').last().boundingBox())
          const firstLink = requireValue(await links.nth(0).boundingBox())
          const secondLink = requireValue(await links.nth(1).boundingBox())

          expect(box.y).toBeGreaterThan(last.y + last.height)
          expect(secondLink.y >= firstLink.y + firstLink.height - 1).toBe(stacked)
          expect(firstLink.height).toBeGreaterThanOrEqual(44)
          expect(secondLink.height).toBeGreaterThanOrEqual(44)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          const clipped = await bridge.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('h2, p, a')].filter(copy => {
              const range = document.createRange()

              range.selectNodeContents(copy)
              return [...range.getClientRects()].some(rect => rect.width > 0 && (
                rect.left < bounds.left - 1 || rect.right > bounds.right + 1
              ))
            }).map(copy => copy.textContent)
          })

          expect(clipped, `${width}px at ${textSize}%`).toEqual([])
        }
        await page.setViewportSize({ width: 1440, height: 1100 })
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '100%'
        })
        const backing = await bridge.evaluate(element => getComputedStyle(element).boxShadow)

        await bridge.hover()
        await expect(bridge).toHaveCSS('box-shadow', backing)
        await expect(bridge).toHaveCSS('transform', 'none')
        await expectNoUnexpectedAccessibilityViolations(page)
        for (const link of await links.all()) {
          await link.focus()
          await expect(link).toHaveCSS('outline-style', 'solid')
          await expect(link).toHaveCSS('outline-width', '2px')
        }
        await links.nth(0).focus()
        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
        await expect(links.nth(1)).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(`${prefix}/blog/`)
      })
    }
  }

  test.describe(`${locale} Reading bridge without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('opens both localized reading destinations', async ({ page }) => {
      for (const [index, destination] of [`${prefix}/blog/series/`, `${prefix}/blog/`].entries()) {
        await page.goto(`${prefix}/blog/series/building-a-production-nextjs-app/`)
        await page.locator('[data-series-reading-bridge]').getByRole('link').nth(index).click()
        await expect(page).toHaveURL(destination)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      }
    })
  })
}
