import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''
  const heading = locale === 'es' ? 'Sigue explorando.' : 'Keep exploring.'

  test(`${locale} archive close follows first, later, and single-page topic archives`, async ({ page }) => {
    for (const slug of ['developer-experience/', 'developer-experience/2/', 'wine/']) {
      await page.goto(`${prefix}/blog/tags/${slug}`)
      const close = page.locator('[data-topic-close]')
      await expect(close.getByRole('heading', { level: 2 })).toHaveText(heading)
      await expect(close.locator('[data-topic-close-count]')).toHaveText(
        locale === 'es' ? ['112 temas', '48 artículos'] : ['112 topics', '48 posts']
      )
      await expect(page.locator('[data-stats-section]')).toHaveCount(0)
      await expect(close.getByRole('link')).toHaveCount(2)
      await expect(close.getByRole('link').first()).toHaveAttribute('href', `${prefix}/blog/tags/`)
      await expect(close.getByRole('link').last()).toHaveAttribute('href', `${prefix}/blog/`)
      expect(await close.evaluate(element => {
        const reading = document.querySelector('[data-topic-reading]')
        return Boolean(reading && reading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
      })).toBe(true)
    }
    await page.locator('[data-topic-close] a').first().press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/tags/`)
    await expect(page.locator('#main')).toBeFocused()
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} archive close supports focus, hover and enlarged text in ${theme}`, async ({ page, browserName }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(`${prefix}/blog/tags/developer-experience/`)
      const close = page.locator('[data-topic-close]')
      const first = close.getByRole('link').first()
      await close.scrollIntoViewIfNeeded()
      const bounds = await first.boundingBox()
      await first.hover()
      await expect(first).toHaveCSS('cursor', 'pointer')
      await expect(first.locator('[data-topic-close-label]')).toHaveCSS('text-decoration-line', 'underline')
      expect(await first.boundingBox()).toEqual(bounds)
      await first.focus()
      await expect(first).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(close.getByRole('link').last()).toBeFocused()
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(first.locator('[data-topic-close-label]')).toHaveCSS('transition-property', 'none')

      for (const [width, size] of [[390, '100%'], [1440, '100%'], [320, '200%']] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '100%'
        })
        const textSizes = await close.locator('h2, [data-topic-close-label]').evaluateAll(elements => elements.map(element => Number.parseFloat(getComputedStyle(element).fontSize)))
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        const enlargedSizes = await close.locator('h2, [data-topic-close-label]').evaluateAll(elements => elements.map(element => Number.parseFloat(getComputedStyle(element).fontSize)))
        expect(enlargedSizes).toEqual(textSizes.map(value => value * Number.parseInt(size) / 100))
        const fits = await close.evaluate(element => [...element.querySelectorAll('h2,p,a,span')].every(child => {
          const rect = child.getBoundingClientRect()
          return child.scrollWidth <= child.clientWidth + 1 && rect.left >= 0 && rect.right <= innerWidth + 1
        }))
        expect(fits).toBe(true)
        expect(await close.getByRole('link').evaluateAll(links => links.every(link => link.getBoundingClientRect().height >= 44))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }

  test.describe(`${locale} archive close without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    for (const destination of ['topics', 'writing'] as const) {
      const href = destination === 'topics' ? `${prefix}/blog/tags/` : `${prefix}/blog/`

      test(`native ${destination} destination remains usable`, async ({ page }) => {
        await page.goto(`${prefix}/blog/tags/developer-experience/2/`)
        const link = page.locator(`[data-topic-close] a[href="${href}"]`)
        await expect(link).not.toHaveAttribute('target', '_blank')
        await link.press('Enter')
        await expect(page).toHaveURL(href)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      })
    }
  })
}
