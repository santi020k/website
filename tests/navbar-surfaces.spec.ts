import { expect, test } from '@playwright/test'
import sharp from 'sharp'

import { requireValue } from './helpers/assertions'

// These assertions need the compositor that paints backdrop filters. The
// repository's default software-rasterizer workaround disables that rendering.
test.use({ launchOptions: { args: [] } })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

for (const theme of ['light', 'dark']) {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 814, height: 844 },
    { width: 1440, height: 900 },
    { width: 814, height: 375 }
  ]) {
    test(`signature shoulder stays continuous at ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/about/')
      await page.evaluate(async value => {
        document.documentElement.dataset.theme = `santi020k-${value}`
        await document.fonts.ready
      }, theme)

      const brand = requireValue(await page.locator('.site-header-brand').boundingBox())
      const clip = {
        x: Math.round(brand.x),
        y: Math.round(brand.y),
        width: Math.ceil(brand.width + 32),
        height: Math.round(brand.height)
      }
      const pixels = await sharp(await page.screenshot({ clip, scale: 'css' })).removeAlpha().raw().toBuffer()
      const sample = (Math.floor(clip.height / 2) * clip.width + 5) * 3
      const surface = [...pixels.subarray(sample, sample + 3)]
      const edges: number[] = []
      const columns = Array.from({ length: clip.width }, (_, x) => x).reverse()

      // Scan the painted contour, not the element box: separate rounded and
      // diagonal pieces used to create a four-pixel notch at their junction.
      for (let y = 8; y < clip.height - 8; y++) {
        const edge = requireValue(columns.find(x => surface.every((value, channel) => {
          const actual = requireValue(pixels[(y * clip.width + x) * 3 + channel])

          return Math.abs(value - actual) <= 1
        })))

        expect(edge).toBeGreaterThan(clip.width / 2)
        edges.push(edge)
      }

      for (const [index, edge] of edges.slice(1).entries()) {
        const step = edge - requireValue(edges[index])

        expect(step).toBeGreaterThanOrEqual(0)
        expect(step).toBeLessThanOrEqual(2)
      }
    })
  }

  for (const width of [390, 814]) {
    test(`open menu joins the header without a shadow band at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/about/')
      await page.evaluate(value => {
        document.documentElement.dataset.theme = `santi020k-${value}`
        window.scrollTo(0, 600)
      }, theme)
      await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')
      await page.locator('[data-mobile-nav-toggle]').click()

      const shell = requireValue(await page.locator('[data-header-shell]').boundingBox())
      const pixels = await sharp(await page.screenshot({
        clip: {
          x: Math.round(shell.x + shell.width / 2),
          y: Math.round(shell.y + shell.height - 12),
          width: 1,
          height: 16
        },
        scale: 'css'
      })).removeAlpha().raw().toBuffer()

      // The blank strip across the join must have one surface color. The panel
      // shadow previously painted a gradient over the bottom of the header.
      for (let channel = 0; channel < 3; channel++) {
        const values = Array.from({ length: 16 }, (_, row) => requireValue(pixels[row * 3 + channel]))

        expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1)
      }
    })

    test(`menu matches native backdrop rendering after navigation at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto('/')
      await page.locator('[data-mobile-nav-toggle]').click()
      await page.locator('[data-mobile-nav-link][href="/about/"]').click()
      await expect(page).toHaveURL('/about/')
      await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')
      await page.locator('[data-mobile-nav-toggle]').click()
      await expect(page.locator('[data-mobile-nav-backdrop]')).toBeVisible()
      await expect(page.locator('[data-mobile-nav-backdrop]')).toHaveCSS('opacity', '1')
      await page.evaluate(async () => {
        const pattern = document.createElement('div')

        pattern.style.cssText = 'position:fixed;inset:750px 0 auto;height:100px;background:repeating-linear-gradient(90deg,#000 0 10px,#fff 10px 20px);'
        document.querySelector('#main')?.append(pattern)
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve()
            })
          })
        })
      })

      const overlayStyle = await page.locator('[data-mobile-nav-backdrop]').evaluate(element => {
        const style = getComputedStyle(element)

        return { background: style.backgroundColor, backdropFilter: style.backdropFilter }
      })
      const band = { left: 100, top: 800, width: 100, height: 1 }
      const actual = await sharp(await page.screenshot({ scale: 'css' })).extract(band).removeAlpha().raw().toBuffer()

      // Compare with an isolated native overlay, without a backdrop-root ancestor.
      // This catches the sharp-page regression in composited screenshots while
      // accounting for macOS WebKit snapshots omitting filters even in controls.
      // Related limitation: https://github.com/microsoft/playwright/issues/13605
      await page.setContent('<div style="position:fixed;inset:0;background:repeating-linear-gradient(90deg,#000 0 10px,#fff 10px 20px)"></div><div id="reference-overlay" style="position:fixed;inset:0"></div>')
      await page.locator('#reference-overlay').evaluate((element, style) => {
        Object.assign(element.style, style)
      }, overlayStyle)
      const expected = await sharp(await page.screenshot({ scale: 'css' })).extract(band).removeAlpha().raw().toBuffer()

      for (const [index, value] of actual.entries()) {
        expect(Math.abs(value - requireValue(expected[index]))).toBeLessThanOrEqual(2)
      }
    })
  }
}
