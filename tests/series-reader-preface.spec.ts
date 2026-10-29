import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''

  for (const slug of ['building-a-production-nextjs-app', 'eslint-in-practice', 'the-santi020k-way']) {
    const perspective = slug === 'the-santi020k-way'
    const english = perspective ? 'The perspective' : 'Who it’s for'
    const spanish = perspective ? 'La perspectiva' : 'Para quién es'

    test(`Reader preface preserves readable copy and focus links: ${slug}, ${locale}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`${prefix}/blog/series/${slug}/#series-preface`)
      const intro = page.locator('[data-series-introduction]')
      const note = intro.locator('[data-series-reader-note]')
      const label = note.locator('[data-series-reader-note-label]')

      await expect(intro).toHaveAttribute('lang', 'en')
      await expect(intro.getByRole('heading', { level: 2 })).toHaveCount(1)
      await expect(label).toHaveText(locale === 'es' ? spanish : english)
      await expect(label).toHaveAttribute('lang', locale)
      await expect(intro.locator('p')).toHaveCount(2)
      const content = await intro.innerText()
      const focus = page.locator('[data-series-focus]')
      const links = await focus.getByRole('link').evaluateAll(elements => elements.map(element => element.getAttribute('href')))

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
          const fits = await intro.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('h2, p, span')].every(copy => {
              const range = document.createRange()

              range.selectNodeContents(copy)
              return [...range.getClientRects()].every(rect => (
                rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
              ))
            })
          })

          expect(fits).toBe(true)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
          await expect(intro).toHaveText(content, { useInnerText: true })
        }
        await page.setViewportSize({ width: 1440, height: 1100 })
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '100%'
        })
        await expectNoUnexpectedAccessibilityViolations(page)
      }
      expect(await focus.getByRole('link').evaluateAll(elements => elements.map(element => element.getAttribute('href')))).toEqual(links)
      const link = focus.getByRole('link').first()
      const destination = requireValue(await link.getAttribute('href'))

      await link.focus()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await link.press('Enter')
      await expect(page).toHaveURL(destination)
    })
  }

  test.describe(`Reader preface without JavaScript, ${locale}`, () => {
    test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

    test('keeps the note and native focus destinations', async ({ page }) => {
      await page.goto(`${prefix}/blog/series/building-a-production-nextjs-app/#series-preface`)
      await expect(page.locator('[data-series-reader-note]')).toContainText('If you are building or rescuing a Next.js codebase')
      const link = page.locator('[data-series-focus]').getByRole('link').first()
      const destination = requireValue(await link.getAttribute('href'))

      await page.evaluate(() => document.fonts.ready)
      await link.click()
      await expect(page).toHaveURL(destination)
    })
  })
}
