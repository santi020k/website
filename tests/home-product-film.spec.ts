import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const locale of ['en', 'es'] as const) {
  test(`the ${locale} film loads on request, plays, and pauses on close`, async ({ page }) => {
    const mediaRequests: string[] = []

    page.on('request', request => {
      if (request.url().endsWith('.mp4')) mediaRequests.push(request.url())
    })
    await page.setViewportSize({ width: locale === 'en' ? 1440 : 390, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(locale === 'en' ? '/' : '/es/')

    const opener = page.locator('[data-film-open]')
    const video = page.locator('[data-film-video]')
    const dialog = page.locator('[data-film-dialog]')

    await expect(opener).toBeVisible()
    await expect(video).not.toHaveAttribute('src')
    expect(mediaRequests).toEqual([])
    await opener.click()
    await expect(dialog).toBeVisible()
    await expect(video).toHaveAttribute('src', locale === 'es' ?
      '/media/products/santi020k-products-portrait.mp4' :
      '/media/products/santi020k-products.mp4')
    await expect.poll(() => video.evaluate(element => (
      element instanceof HTMLVideoElement ? element.currentTime : 0
    ))).toBeGreaterThan(0)
    await expect(video.locator('track[srclang="es"]')).toHaveJSProperty('default', locale === 'es')
    await expectNoUnexpectedAccessibilityViolations(page)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(video).toHaveJSProperty('paused', true)
    await expect(opener).toBeFocused()
    await opener.click()
    await expect(dialog).toBeVisible()
    await dialog.locator('[data-ui-dialog-close]').click()
    await expect(video).toHaveJSProperty('paused', true)
    await expect(opener).toBeFocused()
  })
}

test('the film provides recovery when media cannot be loaded', async ({ page }) => {
  await page.route('**/media/products/*.mp4', route => route.abort())
  await page.goto('/')
  await page.locator('[data-film-open]').click()
  await expect(page.locator('[data-film-error]')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open the video file' })).toHaveAttribute('href', '/media/products/santi020k-products.mp4')
  await page.getByText('Read the visual transcript', { exact: true }).click()
  await expect(page.locator('[data-film-footer] details p')).toContainText('compare the edited landscape')
})

test('the movie remains accessible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: new URL('/', baseURL).href })
  const page = await context.newPage()

  await page.goto('/')
  await expect(page.locator('[data-film-fallback]')).toBeVisible()
  await expect(page.locator('[data-film-fallback]')).toHaveAttribute('href', '/media/products/santi020k-products.mp4')
  await expect(page.locator('[data-film-open]')).toBeHidden()
  await context.close()
})

for (const theme of ['light', 'dark'] as const) {
  test(`the film and hero fit desktop and mobile in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

    for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('[data-film-open]')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await page.screenshot({ fullPage: true, path: `.cache/home-product-film/evidence/after-${name}-${theme}.png`, clip: { x: 0, y: 0, width, height: name === 'mobile' ? 1320 : height } })
      await page.locator('[data-film-open]').click()
      const dialog = page.locator('[data-film-dialog]')

      await expect(dialog).toBeVisible()
      await expect.poll(() => page.locator('[data-film-video]').evaluate(element => element instanceof HTMLVideoElement ? element.currentTime : 0)).toBeGreaterThan(0)
      await page.locator('[data-film-video]').evaluate(element => {
        if (element instanceof HTMLVideoElement) {
          element.pause()
          element.currentTime = 16
        }
      })
      await expect.poll(() => page.locator('[data-film-video]').evaluate(element => element instanceof HTMLVideoElement && !element.seeking)).toBe(true)
      await page.screenshot({ path: `.cache/home-product-film/evidence/player-${name}-${theme}.png` })
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      await expectNoUnexpectedAccessibilityViolations(page)
      await page.keyboard.press('Escape')
    }
  })
}
