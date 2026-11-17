import { expect, test } from '@playwright/test'

const textActions = [
  '.maker-hero-index',
  '.maker-hero-secondary',
  '.studio-text-link',
  '[data-community-footer-link]',
  '.maker-footer-resume',
  '.maker-footer-navigation a[href="/about/"]',
  '.maker-footer-social a',
  '.maker-footer-colophon nav a'
]

test.describe('Pointer text-link feedback', () => {
  test.use({ isMobile: false, hasTouch: false })

  for (const theme of ['light', 'dark'] as const) {
    test(`text links reveal their underline slowly and preserve their icons in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto('/')
      await expect(page.locator('.maker-hero-index .lucide-plus')).toHaveCount(1)
      await expect(page.locator('.maker-hero-index [data-arrow-exchange]')).toHaveCount(0)
      await expect(page.locator('.studio-writing-follow .lucide-rss')).toHaveCount(1)

      for (const selector of textActions) {
        const link = page.locator(selector).first()
        const label = link.locator('[data-text-link-label]')
        await link.scrollIntoViewIfNeeded()
        await page.mouse.move(0, 0)
        await expect(label).toHaveCSS('background-size', '0% 1px')
        const before = await link.boundingBox()
        const icons = await link.locator('svg').evaluateAll(elements => elements.map(element => element.outerHTML))
        await expect(link).toHaveCSS('transition-duration', '0.48s')
        await expect(label).toHaveCSS('transition-duration', '0.48s')
        await expect(label).toHaveCSS('transition-property', 'background-size')

        await link.hover()
        await expect(label).toHaveCSS('background-size', '100% 1px')
        await expect(link).toHaveCSS('text-decoration-line', 'none')
        expect(await link.boundingBox()).toEqual(before)
        expect(await link.locator('svg').evaluateAll(elements => elements.map(element => element.outerHTML))).toEqual(icons)

        await page.mouse.move(0, 0)
        await expect(label).toHaveCSS('background-size', '0% 1px')
        expect(await link.boundingBox()).toEqual(before)
      }

      // The current page remains identifiable even while another link is hovered.
      await expect(page.locator('.maker-footer-navigation [aria-current="page"]')).toHaveCSS('text-decoration-line', 'underline')
    })
  }
})

test('text links retain keyboard focus, native navigation and reduced-motion feedback', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: 'Explore all projects' })
  const label = link.locator('[data-text-link-label]')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await link.focus()
  await expect(link).toHaveCSS('outline-style', 'solid')
  await expect(link).toHaveCSS('transition-property', 'none')
  await expect(label).toHaveCSS('transition-property', 'none')
  await expect(label).toHaveCSS('background-size', '100% 1px')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/projects/')
})

test('blog section actions share the text-link treatment', async ({ page }) => {
  await page.goto('/blog/')
  const link = page.locator('[data-blog-series-browse][data-text-link]')
  const label = link.locator('[data-text-link-label]')
  await link.focus()
  await expect(label).toHaveCSS('background-size', '100% 1px')
  await expect(label).toHaveCSS('transition-duration', '0.48s')
  await expect(link).toHaveCSS('outline-style', 'solid')
})

test('touch navigation keeps the plus and avoids a sticky hover underline', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  try {
    await page.goto('/')
    const link = page.getByRole('link', { name: 'Explore all projects' })
    await link.hover()
    await expect(link.locator('[data-text-link-label]')).toHaveCSS('background-size', '0% 1px')
    await expect(link.locator('.lucide-plus')).toBeVisible()
    await link.tap()
    await expect(page).toHaveURL('/projects/')
  } finally {
    await context.close()
  }
})

test('forced colors retain a visible underline for keyboard focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
  await page.goto('/')
  const link = page.getByRole('link', { name: 'Explore all projects' })
  await link.focus()
  await expect(link.locator('[data-text-link-label]')).toHaveCSS('text-decoration-line', 'underline')
  await expect(link).toHaveCSS('outline-style', 'solid')
})
