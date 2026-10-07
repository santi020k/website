import { expect, test } from '@playwright/test'
import sharp from 'sharp'

for (const theme of ['light', 'dark']) {
  for (const width of [390, 768, 1023]) {
    test(`homepage background flows beneath the mobile header at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.evaluate(selectedTheme => {
        document.documentElement.dataset.theme = selectedTheme
      }, theme)

      const hero = await page.locator('[data-home-hero]').boundingBox()

      if (!hero) throw new Error('Homepage hero has no layout bounds')

      expect(hero.y).toBeGreaterThan(0)

      // Compare adjacent rows at the hero's edge, outside the navbar shadow.
      // An opaque hero gradient creates a visible horizontal band below the header.
      const screenshot = await page.screenshot({
        animations: 'disabled',
        clip: { x: 0, y: Math.round(hero.y) - 1, width: 4, height: 2 },
        scale: 'css'
      })
      const pixels = await sharp(screenshot).removeAlpha().raw().toBuffer()
      const rowSize = 4 * 3

      for (let channel = 0; channel < 3; channel++) {
        let difference = 0

        for (let pixel = 0; pixel < 4; pixel++) {
          const index = pixel * 3 + channel
          const above = pixels[index]
          const below = pixels[index + rowSize]

          if (above === undefined || below === undefined) {
            throw new Error('Background screenshot is missing pixel data')
          }

          difference += Math.abs(above - below)
        }

        expect(difference / 4).toBeLessThan(8)
      }
    })
  }
}
