import { expect, test } from '@playwright/test'

test('the home link includes its visible brand in its accessible name', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.site-header-brand')).toHaveAccessibleName('santi020k — Santiago Molina home')
})

test('preloads are reserved for the font and the requested portrait', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0)
  await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(1)

  await page.goto('/about/')

  const portrait = page.locator('[data-about-hero-portrait] img')
  const preload = page.locator('link[rel="preload"][as="image"]')

  await expect(preload).toHaveCount(1)
  await expect(preload).toHaveAttribute('imagesrcset', await portrait.getAttribute('srcset') ?? '')
  await expect(preload).toHaveAttribute('imagesizes', await portrait.getAttribute('sizes') ?? '')
})

test('the homepage portrait stays within its mobile transfer budget', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/')

  const portrait = page.locator('.maker-hero-portrait')

  await expect(portrait).toHaveJSProperty('complete', true)

  const image = await portrait.evaluate(element => {
    if (!(element instanceof HTMLImageElement)) throw new Error('Missing homepage portrait')

    return { url: element.currentSrc, pixelRatio: window.devicePixelRatio }
  })

  const response = await page.request.get(image.url)

  expect(response.ok()).toBe(true)
  expect((await response.body()).byteLength).toBeLessThanOrEqual(image.pixelRatio <= 1 ? 20_000 : 70_000)
})

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`back to top skips hidden controls and restores keyboard focus (${reducedMotion})`, async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/blog/')

    const button = page.locator('#back-to-top')

    await expect(button).toBeHidden()
    await button.evaluate(element => {
      element.focus()
    })
    await expect(button).not.toBeFocused()

    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    })
    await expect(button).toBeVisible()
    await button.focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('#main')).toBeFocused()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(button).toBeHidden()

    // Safari on macOS uses Option-Tab to include links in keyboard navigation.
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(page.locator('#main a').first()).toBeFocused()

    await page.locator('[data-site-footer] a[href="/about/"]').click()
    await expect(page).toHaveURL(/\/about\/$/u)
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
    await expect(button).toBeHidden()
    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    })
    await expect(button).toBeVisible()
    await button.focus()
    await page.keyboard.press('Space')
    await expect(page.locator('#main')).toBeFocused()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })
}
