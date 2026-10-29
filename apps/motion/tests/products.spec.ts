import { expect, test } from '@playwright/test'

for (const format of ['landscape', 'portrait'] as const) {
  test(`the ${format} product film retains six scenes, local recordings, and a 30-second timeline`, async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', error => errors.push(error.message))

    await page.setViewportSize({ width: format === 'portrait' ? 1080 : 1920, height: format === 'portrait' ? 1350 : 1080 })

    await page.goto(format === 'portrait' ? '/products-portrait/' : '/products/')

    await page.evaluate(async () => {
      await document.fonts.ready

      await Promise.all([...document.images].map(image => image.decode()))
    })

    await expect.poll(() => page.evaluate(() => window.__timelines?.['product-film']?.duration())).toBe(30)

    await expect(page.locator('.scene')).toHaveCount(6)

    for (const [scene, time] of [
      ['opening', 1.5],
      ['lumen-web', 6],
      ['lumen-native', 11],
      ['postlens', 16],
      ['ecosystem', 23.5],
      ['ending', 28.5]
    ] as const) {
      await page.evaluate(time => {
        window.__timelines?.['product-film']?.pause().seek(time)
      }, time)

      await expect(page.locator(`.${scene}`)).toBeVisible()

      await expect(page.locator('.scene:visible')).toHaveCount(1)

      await page.screenshot({ path: `renders/stills/products-${format}-${scene}.png` })
    }

    for (const recording of await page.locator('video').all()) {
      await expect.poll(() => recording.evaluate(video => (
        video instanceof HTMLVideoElement && video.readyState >= 2 && video.videoWidth > 0
      ))).toBe(true)
    }

    for (const [selector, times] of [
      ['.workspace-plate', [3, 3.15, 3.4]],
      ['.native-workspace', [9, 9.15, 9.4]]
    ] as const) {
      for (const time of times) {
        await page.evaluate(time => {
          window.__timelines?.['product-film']?.pause().seek(time)
        }, time)

        await expect(page.locator(selector)).toHaveCSS('opacity', '1')

        await expect(page.locator(selector)).toBeInViewport({ ratio: 0.95 })

        await page.screenshot({ path: `renders/stills/lumen-${format}-handoff-${time}.png` })
      }
    }

    expect(errors).toEqual([])
  })
}
