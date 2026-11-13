import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const articles = [
  {
    name: 'series',
    path: '/blog/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library/',
    destination: 'https://towardsdev.com/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library-3a4cbc1993a7'
  },
  {
    name: 'standalone',
    path: '/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/',
    destination: 'https://towardsdev.com/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set-482623476dcf'
  }
] as const
const tabKey = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
}
const layouts = [
  { width: 320, size: 100, theme: 'light', locale: 'en' },
  { width: 390, size: 200, theme: 'dark', locale: 'es' },
  { width: 1440, size: 100, theme: 'dark', locale: 'en' },
  { width: 1440, size: 200, theme: 'light', locale: 'es' }
] as const

test.use({ reducedMotion: 'reduce' })

for (const article of articles) {
  for (const layout of layouts) {
    const path = `${layout.locale === 'es' ? '/es' : ''}${article.path}`
    const mediumName = layout.locale === 'es' ? 'Leer en Medium' : 'Read on Medium'

    test(`${article.name} publication sharing fits ${layout.width}px at ${layout.size}% in ${layout.theme}/${layout.locale}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width: layout.width, height: 1000 })
      await page.addInitScript(theme => {
        localStorage.setItem('theme', theme)
      }, layout.theme)
      await page.goto(`${path}?source=publication#article-topics-heading`)
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = `${size}%`
        await document.fonts.ready
      }, layout.size)
      const utilities = page.locator('[data-article-utilities]')
      const medium = utilities.getByRole('link', { name: mediumName, exact: true })

      await expect(medium).toHaveAttribute('href', article.destination)
      await expect(medium).toHaveAttribute('target', '_blank')
      await expect(medium).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(page.locator('#article-copy-link')).toHaveCount(0)
      await expect(page.locator('#article-copy-link-recovery')).toHaveCount(0)
      expect(await utilities.evaluate(element => {
        const controls = [...element.querySelectorAll('a, button')]
        const bounds = element.getBoundingClientRect()

        return document.documentElement.scrollWidth <= innerWidth &&
          controls.every(control => {
            const rect = control.getBoundingClientRect()
            return rect.left >= bounds.left && rect.right <= bounds.right + 1 &&
              rect.height >= 44 && control.scrollWidth <= control.clientWidth + 1
          })
      })).toBe(true)
      await page.keyboard.press(tabKey[browserName])
      await medium.focus()
      await expect(medium).toBeFocused()
      await expect(medium).toHaveCSS('outline-style', 'solid')
      expect((await new AxeBuilder({ page }).include('[data-article-utilities]').analyze()).violations).toEqual([])
      await page.emulateMedia({ media: 'print' })
      await expect(utilities).toBeHidden()
    })
  }
}

test.describe('Publication sharing pointer feedback', () => {
  test.use({ isMobile: false, hasTouch: false })

  for (const theme of ['light', 'dark'] as const) {
    test(`publication hovers preserve geometry, contrast and reduced motion in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(articles[0].path)
      const utilities = page.locator('[data-article-utilities]')
      const medium = utilities.getByRole('link')

      await utilities.scrollIntoViewIfNeeded()
      for (const control of [medium]) {
        const before = await control.boundingBox()
        const background = await control.evaluate(element => getComputedStyle(element).backgroundColor)

        await control.hover()
        await expect(control).not.toHaveCSS('background-color', background)
        expect(await control.boundingBox()).toEqual(before)
        await expect(control).toHaveCSS('transition-property', 'none')
        expect((await new AxeBuilder({ page }).include('[data-article-utilities]').analyze()).violations).toEqual([])
      }
      await expect(medium.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'none')
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.mouse.move(0, 0)
      await medium.hover()
      await expect(medium.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'arrow-exchange')
      await expect(medium.locator('[data-arrow-track]')).toHaveCSS('animation-duration', '0.48s')
    })
  }
})

test('publication destinations stay available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  for (const article of articles) {
    await page.goto(article.path)
    await expect(page.locator('[data-article-copy]')).toBeHidden()
    await expect(page.getByRole('link', { name: 'Read on Medium', exact: true })).toBeVisible()
  }
  await context.close()
})
