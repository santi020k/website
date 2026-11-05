import { expect, test } from '@playwright/test'

test('the Spanish writing count separates its sort label', async ({ page }) => {
  await page.goto('/es/blog/')
  await expect(page.locator('[data-blog-primary-path] p')).toHaveText(/^\d+ artículos · Más recientes primero$/u)
})

for (const theme of ['light', 'dark']) {
  test(`Reading paths support keyboard navigation in ${theme}`, async ({ page, browserName }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/blog/')
    const hero = page.locator('[data-blog-hero]')
    const writing = hero.getByRole('link', { name: 'Explore the writing' })
    const paths = hero.getByRole('navigation', { name: 'Choose how to read' })
    const topics = paths.getByRole('link', { name: /Browse topics/u })
    const series = paths.getByRole('link', { name: /Follow a series/u })

    await expect(writing).toHaveAttribute('href', '#posts')
    await expect(topics).toHaveAccessibleName(/^\d+ topics Browse topics$/u)
    await expect(series).toHaveAccessibleName('Connected posts Follow a series')
    await expect(hero.locator('[data-blog-primary-path] p')).toHaveText(/^\d+ posts · Latest first$/u)
    await writing.focus()
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(topics).toBeFocused()
    await expect(topics).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(series).toBeFocused()
    await expect(series).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab')
    await expect(topics).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/$/u)
    await page.goBack()
    await series.press('Enter')
    await expect(page).toHaveURL(/\/blog\/series\/$/u)
  })

  test(`Reading paths remain readable at narrow widths and enlarged text in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/blog/')

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of ['100%', '200%']) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        const paths = page.getByRole('navigation', { name: 'Choose how to read' })
        for (const link of await paths.getByRole('link').all()) {
          await expect(link).toBeVisible()
          const layout = await link.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            return {
              height: bounds.height,
              insideViewport: bounds.left >= 0 && bounds.right <= innerWidth,
              fits: element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1
            }
          })
          expect(layout.height).toBeGreaterThanOrEqual(44)
          expect(layout.insideViewport).toBe(true)
          expect(layout.fits).toBe(true)
          await expect(link.locator('[data-blog-path-title]')).toHaveCSS('transition-property', 'none')
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
    }
  })
}

test.describe('Reading paths without JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  test('the feed, topics and series remain native destinations', async ({ page }) => {
    await page.goto('/blog/')
    const hero = page.locator('[data-blog-hero]')
    await hero.getByRole('link', { name: 'Explore the writing' }).press('Enter')
    await expect(page).toHaveURL(/#posts$/u)
    await expect(page.locator('#posts')).toBeInViewport()
    const topics = hero.getByRole('link', { name: /Browse topics/u })
    await expect(topics).not.toHaveAttribute('target', '_blank')
    await topics.press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/$/u)
    await page.goBack()
    const series = hero.getByRole('link', { name: /Follow a series/u })
    await expect(series).not.toHaveAttribute('target', '_blank')
    await series.press('Enter')
    await expect(page).toHaveURL(/\/blog\/series\/$/u)
  })
})
