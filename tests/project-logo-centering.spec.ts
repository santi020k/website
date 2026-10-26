import { expect, test } from '@playwright/test'
import sharp from 'sharp'

const measureLogo = async (screenshot: Buffer) => {
  const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let left = info.width
  let right = -1
  let top = info.height
  let bottom = -1

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset] ?? 0
    const green = data[offset + 1] ?? 0
    const blue = data[offset + 2] ?? 0

    // Isolate the bright mint mark from the darker decorative folds.
    if (green < 225 || blue < 120 || green < red * 1.5) continue
    const x = (offset / info.channels) % info.width
    const y = Math.floor(offset / info.channels / info.width)

    left = Math.min(left, x)
    right = Math.max(right, x)
    top = Math.min(top, y)
    bottom = Math.max(bottom, y)
  }

  return {
    height: bottom - top + 1,
    width: right - left + 1,
    horizontalOffset: Math.abs((left + right + 1) / 2 - info.width / 2),
    verticalOffset: Math.abs((top + bottom + 1) / 2 - info.height / 2)
  }
}

for (const width of [375, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`project logo stays centered at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto('/portfolio/lumen-ui/')
      await page.evaluate(() => document.fonts.ready)

      const card = page.locator('[data-related-project]').filter({ has: page.getByRole('heading', { name: '@santi020k/og', exact: true }) })
      const artwork = card.locator('[data-related-artwork]')

      await artwork.scrollIntoViewIfNeeded()
      await expect(card.locator('img')).toBeVisible()
      await expect.poll(() => card.locator('img').evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true)
      await card.screenshot({ path: testInfo.outputPath('project-card.png') })

      const logo = await measureLogo(await artwork.screenshot())

      expect(logo.width).toBeGreaterThan(0)
      expect(logo.height).toBeGreaterThan(0)
      expect(logo.horizontalOffset).toBeLessThanOrEqual(1.5)
      expect(logo.verticalOffset).toBeLessThanOrEqual(1.5)
    })
  }
}
