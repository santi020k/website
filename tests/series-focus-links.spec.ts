import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

const samples = [
  { plain: [], slug: 'building-a-production-nextjs-app', topics: ['nextjs', 'testing', 'ci-cd', 'architecture'] },
  { plain: [], slug: 'eslint-in-practice', topics: ['eslint', 'developer-experience', 'typescript'] },
  { plain: ['Delivery Systems'], slug: 'the-santi020k-way', topics: ['engineering-culture', 'code-quality', 'code-review'] }
]

for (const locale of ['en', 'es']) {
  const prefix = locale === 'es' ? '/es' : ''

  for (const theme of ['light', 'dark'] as const) {
    for (const { plain, slug, topics } of samples) {
      test(`series focus topics remain usable: ${slug}, ${locale}, ${theme}`, async ({ page, request, browserName }) => {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        await page.goto(`${prefix}/blog/series/${slug}/`)
        const focus = page.locator('[data-series-focus]')
        const links = focus.getByRole('link')
        const paths = topics.map(topic => `${prefix}/blog/tags/${topic}/`)

        await expect(focus.locator('[data-focus-guidance]')).toHaveText(locale === 'es' ?
          'Explora estos temas en el Blog.' :
          'Explore these topics across the Blog.')
        expect(await links.evaluateAll(elements => elements.map(element => element.getAttribute('href')))).toEqual(paths)
        for (const path of paths) expect((await request.get(path)).status()).toBe(200)
        const unmatched = focus.locator('div[data-focus-row]')

        await expect(unmatched.locator('[data-focus-name]')).toHaveText(plain)
        await expect(unmatched.getByRole('link')).toHaveCount(0)
        await expect(unmatched.locator('[data-arrow-exchange]')).toHaveCount(0)
        for (const [width, textSize] of [[1440, 100], [768, 100], [390, 100], [320, 200]] as const) {
          await page.setViewportSize({ width, height: 1000 })
          await page.evaluate(size => {
            document.documentElement.style.fontSize = `${size}%`
          }, textSize)
          await page.evaluate(() => document.fonts.ready)
          const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)

          expect(documentWidth).toBeLessThanOrEqual(width)
          for (const link of await links.all()) {
            const box = requireValue(await link.boundingBox())

            expect(box.height).toBeGreaterThanOrEqual(44)
            await link.focus()
            await expect(link).toHaveCSS('outline-style', 'solid')
          }
        }
        await expectNoUnexpectedAccessibilityViolations(page)
        await links.first().focus()
        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
        await expect(links.nth(1)).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(requireValue(paths[1]))
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      })
    }
  }

  test.describe(`series focus topics without scripts: ${locale}`, () => {
    test.use({ javaScriptEnabled: false })

    test('opens the native topic archive', async ({ page }) => {
      await page.goto(`${prefix}/blog/series/building-a-production-nextjs-app/`)
      await page.locator('[data-series-focus]').getByRole('link', { name: 'Next.js', exact: true }).click()
      await expect(page).toHaveURL(`${prefix}/blog/tags/nextjs/`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })
}
