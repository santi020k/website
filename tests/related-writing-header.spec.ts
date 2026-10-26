import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const examples = [
  { route: '/blog/run-repo-on-mac-with-silo-dxmt/', action: 'Browse all posts', href: '/blog/' },
  { route: '/blog/why-i-moved-my-eslint-library-to-eslint-config-basic/', action: 'Explore the developer experience guide', href: '/developer-experience/' }
]
const nextKeys = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
}
const previousKeys = {
  chromium: 'Shift+Tab',
  firefox: 'Shift+Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab'
}

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Topic context remains readable and keyboard usable at ${width}px in ${theme}`, async ({ page, browserName }) => {
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
          const topics = header.getByRole('navigation', { name: 'Topics shared with these recommendations' }).getByRole('link')

          expect(await topics.count()).toBeGreaterThan(0)
          expect(await topics.count()).toBeLessThanOrEqual(2)
          await topics.last().focus()
          await page.keyboard.press(nextKeys[browserName])
          await expect(browse).toBeFocused()
          await page.keyboard.press(previousKeys[browserName])
          await expect(topics.last()).toBeFocused()
          await page.keyboard.press(nextKeys[browserName])
          expect(await browse.evaluate(element => {
            const style = getComputedStyle(element)
            return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
          })).toBe(true)
          expect(await header.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            const gallery = element.closest('[data-page-section]')?.querySelector('[data-post-gallery-grid]')?.getBoundingClientRect()
            return bounds.left >= 0 && bounds.right <= innerWidth + 1 && gallery !== undefined &&
              gallery.top >= bounds.bottom && [...element.querySelectorAll('h2, p, a')].every(item => item.scrollWidth <= item.clientWidth + 1) &&
              [...element.querySelectorAll('[data-related-topic-list] a')].every(item => item.getBoundingClientRect().height >= 44)
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

test('topic context explains the displayed articles and follows its archive links', async ({ page }) => {
  await page.goto('/blog/playwright-accessibility-checks-that-teams-keep-running/')
  const topics = page.locator('#related-writing').getByRole('navigation', { name: 'Topics shared with these recommendations' })

  await expect(topics.getByRole('link')).toHaveText(['accessibility', 'testing'])
  await expect(topics.getByRole('link', { name: 'accessibility', exact: true })).toHaveAttribute('href', '/blog/tags/accessibility/')
  await expect(topics.getByRole('link', { name: 'testing', exact: true })).toHaveAttribute('href', '/blog/tags/testing/')
  await topics.getByRole('link', { name: 'accessibility', exact: true }).press('Enter')
  await expect(page).toHaveURL('/blog/tags/accessibility/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('accessibility')
})

test.describe('Topic context without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('shared topics are usable native destinations', async ({ page }) => {
    await page.goto('/blog/playwright-accessibility-checks-that-teams-keep-running/')
    await page.locator('#related-writing').getByRole('link', { name: 'testing', exact: true }).press('Enter')
    await expect(page).toHaveURL('/blog/tags/testing/')
  })
})
