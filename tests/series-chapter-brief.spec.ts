import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const seriesSlugs = ['building-a-production-nextjs-app', 'eslint-in-practice', 'the-santi020k-way']

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''

  for (const slug of seriesSlugs) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${locale} ${slug} opens with its first chapter in ${theme}`, async ({ browserName, page }) => {
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto(`${prefix}/blog/series/${slug}/`)
        const chapters = page.locator('[data-post-gallery-card]')
        const firstChapter = chapters.first()
        const first = page.locator('[data-series-entry-first]')
        const href = await firstChapter.getByRole('link').getAttribute('href')
        const title = await firstChapter.getByRole('heading').innerText()
        const minutes = await firstChapter.locator('[data-post-gallery-footer] > span:last-child').innerText()
        const count = await chapters.count()
        const destinations = await chapters.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))

        await expect(first).toHaveAttribute('href', href ?? '')
        await expect(first.getByRole('heading')).toHaveText(title)
        await expect(first.getByRole('heading')).toHaveAttribute('lang', 'en')
        await expect(first.locator('[data-series-entry-meta]')).toContainText(minutes)
        await expect(page.locator('[data-series-entry-count]')).toHaveText(locale === 'es' ? `${count} artículos conectados` : `${count} connected articles`)
        await expect(first.locator('[data-series-entry-label]')).toHaveText(locale === 'es' ? 'Empieza por el artículo 1' : 'Begin with article 1')
        await expect(page.locator('[data-series-summary]')).toHaveCount(0)
        await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'en')
        await expect(page.locator('[data-series-entry-return]')).toHaveAttribute('href', `${prefix}/blog/series/`)

        for (const [width, fontSize, stacked] of [[1440, '100%', false], [768, '100%', false], [390, '100%', true], [320, '200%', true]] as const) {
          await page.setViewportSize({ width, height: 1100 })
          await page.evaluate(value => {
            document.documentElement.style.fontSize = value
          }, fontSize)
          const geometry = await page.locator('[data-series-entry-spread]').evaluate(element => {
            const copy = element.querySelector('[data-series-entry-copy]')?.getBoundingClientRect()
            const card = element.querySelector('[data-series-entry-card]')?.getBoundingClientRect()
            if (!copy || !card) throw new Error('Missing Chapter brief content')

            return {
              stacked: card.top > copy.bottom,
              fits: [...element.querySelectorAll('h1,h2,p,a')].every(node => node.scrollWidth <= node.clientWidth + 1)
            }
          })
          expect(geometry.stacked).toBe(stacked)
          expect(geometry.fits).toBe(true)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        }
        expect(await chapters.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(destinations)
        await expectNoUnexpectedAccessibilityViolations(page)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '100%'
        })
        const allChapters = page.locator('[data-series-entry-chapters]')
        await allChapters.focus()
        await expect(allChapters).toHaveCSS('outline-style', 'solid')
        await allChapters.press('Enter')
        await expect(page).toHaveURL(`${prefix}/blog/series/${slug}/#series-chapters`)
        const arrival = await page.locator('#series-chapters').evaluate(element => ({
          top: element.getBoundingClientRect().top,
          bottom: element.getBoundingClientRect().bottom,
          viewport: innerHeight
        }))
        expect(arrival.top).toBeGreaterThanOrEqual(0)
        expect(arrival.bottom).toBeLessThan(arrival.viewport)
        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
        await expect(firstChapter.getByRole('link')).toBeFocused()
        await first.focus()
        await expect(first).toHaveCSS('outline-style', 'solid')
        await first.press('Enter')
        await expect(page).toHaveURL(href ?? '')
      })
    }
  }

  test.describe(`${locale} Chapter brief without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('keeps native chapter navigation and the return destination', async ({ browserName, page }) => {
      const route = `${prefix}/blog/series/building-a-production-nextjs-app/`
      await page.goto(route)
      const first = page.locator('[data-series-entry-first]')
      await expect(first).toBeVisible()
      const chapters = page.locator('[data-series-entry-chapters]')
      await chapters.press('Enter')
      await expect(page).toHaveURL(`${route}#series-chapters`)
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(page.locator('[data-post-gallery-card]').first().getByRole('link')).toBeFocused()
      await page.locator('[data-series-entry-return]').press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/series/`)
    })
  })
}
