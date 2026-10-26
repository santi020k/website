import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const examples = [
  { route: '/blog/run-repo-on-mac-with-silo-dxmt/', action: 'Browse all posts', href: '/blog/' },
  { route: '/blog/why-i-moved-my-eslint-library-to-eslint-config-basic/', action: 'Explore the developer experience guide', href: '/developer-experience/' }
]

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Margin continuation remains readable and keyboard usable at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme: theme })
      for (const example of examples) {
        await page.goto(example.route)
        for (const size of ['100%', '200%']) {
          await page.evaluate(async textSize => {
            document.documentElement.style.fontSize = textSize
            await document.fonts.ready
          }, size)
          const header = page.locator('#related-writing')
          await expect(header.getByRole('heading', { level: 2 })).toHaveText('Keep reading in the same thread.')
          await expect(header.locator('[data-margin-header-label]')).toHaveText('Related writing')
          const browse = header.getByRole('link', { name: example.action, exact: true })
          await expect(browse).toHaveAttribute('href', example.href)
          await browse.focus()
          await page.keyboard.press('Tab')
          await page.keyboard.press('Shift+Tab')
          await expect(browse).toBeFocused()
          expect(await browse.evaluate(element => {
            const style = getComputedStyle(element)
            return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
          })).toBe(true)
          expect(await header.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            const gallery = element.closest('[data-page-section]')?.querySelector('[data-post-gallery-grid]')?.getBoundingClientRect()
            return bounds.left >= 0 && bounds.right <= innerWidth + 1 && gallery !== undefined &&
              gallery.top >= bounds.bottom && [...element.querySelectorAll('h2, p, a')].every(item => item.scrollWidth <= item.clientWidth + 1)
          })).toBe(true)
          const audit = await new AxeBuilder({ page }).include('#related-writing').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
          expect(audit.violations).toEqual([])
        }
      }
    })
  }
}

test.describe('Related writing without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const example of examples) {
    test(`the header retains its native browse destination on ${example.route}`, async ({ page }) => {
      await page.goto(example.route)
      await page.locator('#related-writing').getByRole('link', { name: example.action, exact: true }).press('Enter')
      await expect(page).toHaveURL(example.href)
    })
  }
})
