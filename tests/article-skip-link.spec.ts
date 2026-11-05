import { expect, test } from '@playwright/test'

const route = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const tabKey = { chromium: 'Tab', firefox: 'Tab', webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab' }

test.use({ reducedMotion: 'reduce' })

for (const variant of [
  { locale: 'en', prefix: '', main: 'Skip to content', article: 'Skip to article text', width: 1440, javaScriptEnabled: true },
  { locale: 'es', prefix: '/es', main: 'Saltar al contenido', article: 'Saltar al texto del artículo', width: 390, javaScriptEnabled: false }
] as const) {
  test.describe(variant.locale, () => {
    test.use({ viewport: { width: variant.width, height: 900 }, javaScriptEnabled: variant.javaScriptEnabled })

    test('moves keyboard focus directly from the page opening to the prose', async ({ browserName, page }) => {
      await page.goto(variant.prefix + route)
      const mainSkip = page.getByRole('link', { name: variant.main, exact: true })
      const articleSkip = page.getByRole('link', { name: variant.article, exact: true })
      const prose = page.locator('#article-content')

      await expect(articleSkip).not.toBeInViewport()
      await page.keyboard.press(tabKey[browserName])
      await expect(mainSkip).toBeFocused()
      await page.keyboard.press('Enter')
      await page.keyboard.press(tabKey[browserName])
      await expect(articleSkip).toBeFocused()
      await expect(articleSkip).toBeInViewport()
      await expect.poll(() => articleSkip.evaluate(link => {
        const { left, top, width, height } = link.getBoundingClientRect()

        return document.elementFromPoint(left + width / 2, top + height / 2) === link
      })).toBe(true)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#article-content$/u)
      await expect(prose).toBeFocused()
      await expect(prose).toBeInViewport()
      await page.keyboard.press(tabKey[browserName])
      await expect(prose.locator(':focus')).toHaveCount(1)
    })
  })
}
