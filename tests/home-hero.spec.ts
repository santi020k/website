import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('the hero connects products, personal background, and the full portfolio', async ({ page }) => {
  await page.goto('/')

  const hero = page.locator('[data-home-hero]')

  await expect(page.locator('h1')).toHaveCount(1)
  await expect(hero.locator('h1')).toContainText('I build products.')
  await expect(hero.locator('a[href="/portfolio/"]')).toHaveAccessibleName('Explore my work')
  await expect(hero.locator('a[href="/portfolio/"]')).toHaveAttribute('href', '/portfolio/')
  await expect(hero.locator('a[href="/portfolio/lumen-ui/"]')).toHaveAttribute('href', '/portfolio/lumen-ui/')
  await expect(hero.locator('a[href="/portfolio/postlens/"]')).toHaveAttribute('href', '/portfolio/postlens/')
  await expect(hero.locator('img[alt="Portrait of Santiago Molina, smiling"]')).toBeVisible()
  await expect(hero.locator('img[alt="Portrait of Santiago Molina, smiling"]')).toHaveJSProperty('complete', true)

  await hero.locator('a[href="/about/"]').click()
  await expect(page).toHaveURL(/\/about\/$/)
  await expect(page.locator('h1')).toContainText('Calm systems.')
  await expect(page.locator('img[alt="Portrait of Santiago Molina (@santi020k)"]')).toBeVisible()
  await expect(page.locator('[data-about-hero] a[href="/resume/"]')).toHaveAttribute('href', '/resume/')

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(hero).toBeVisible()
  await expect(page.locator('[data-particles-bg]')).toBeVisible()
})

test('hero product bookmarks preserve destinations and keyboard navigation', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const products = page.getByRole('navigation', { name: 'Featured products' })
  const links = products.getByRole('link')

  await expect(links).toHaveCount(3)
  await expect(links.nth(0)).toHaveAccessibleName('Lumen UI One system. Many platforms.')
  await expect(links.nth(1)).toHaveAccessibleName('PostLens A little more from every photo.')
  await expect(links.nth(2)).toHaveAccessibleName('Explore all projects')
  await expect(links.nth(2)).toBeVisible()
  await expect(links.nth(2)).toHaveAttribute('href', '/projects/')
  await links.first().focus()
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
  await expect(links.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/portfolio\/postlens\/$/)
  await page.goBack()
  await links.nth(2).click()
  await expect(page).toHaveURL(/\/projects\/$/)
})

for (const theme of ['light', 'dark'] as const) {
  test(`hero product bookmarks keep complete text and logos at enlarged sizes in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%'
        await document.fonts.ready
      })

      const products = page.getByRole('navigation', { name: 'Featured products' })

      for (const link of await products.getByRole('link').all()) {
        await expect(link).toBeVisible()
        const clipped = await link.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const range = document.createRange()

          range.selectNodeContents(element)
          return [...range.getClientRects()].some(rect => rect.width > 0 && (
            rect.left < bounds.left - 1 || rect.right > bounds.right + 1
          ))
        })

        expect(clipped).toBe(false)
        await link.focus()
        await expect(link).toHaveCSS('outline-style', 'solid')
      }

      for (const image of await products.locator('img').all()) {
        await expect(image).toBeVisible()
        await expect.poll(() => image.evaluate(
          element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
        )).toBe(true)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  })

  test(`hero remains usable at mobile, tablet, and desktop widths in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    for (const width of [320, 375, 640, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      // Wait for responsive styles and fonts before measuring the resized hero.
      await page.evaluate(async () => {
        await document.fonts.ready
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve()
            })
          })
        })
      })

      const hero = page.locator('[data-home-hero]')
      const heading = hero.locator('h1')
      const action = hero.locator('a[href="/portfolio/"]')
      const bounds = await heading.boundingBox()

      expect(bounds).not.toBeNull()
      expect(bounds?.x).toBeGreaterThanOrEqual(0)
      expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
      await expect(action).toBeVisible()
      await action.focus()
      await expect(action).toBeFocused()
      await expect(hero.locator('a[href="/about/"]')).toBeVisible()
    }

    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
