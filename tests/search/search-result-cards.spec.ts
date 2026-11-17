import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const entries = [
  { title: 'Lumen UI', type: 'project', path: '/portfolio/lumen-ui/', coverUrl: '/og/portfolio/lumen-ui.webp' },
  { title: 'Lumen article with a long title that must remain fully readable', type: 'post', path: '/blog/' },
  { title: 'Lumen community', type: 'community', path: '/speaking/', coverUrl: '/missing-search-cover.webp' }
].map(entry => ({
  ...entry,
  description: 'Accessible interfaces need readable titles, complete descriptions, and predictable keyboard navigation across narrow screens and enlarged text.',
  tags: ['Lumen']
}))

for (const theme of ['light', 'dark'] as const) {
  test(`Cover ledger keeps complete copy, artwork fallbacks, and inset arrows in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
    await page.route('**/missing-search-cover.webp', route => route.fulfill({ status: 404, body: '' }))
    await page.goto('/resume/?q=lumen')
    const results = page.locator('[data-site-search-result]')

    await expect(results).toHaveCount(3)
    await expect(page.locator('[data-site-search-thumb-state="loaded"]')).toHaveCount(1)
    await expect(page.locator('[data-site-search-thumb-state="error"]')).toHaveCount(1)
    for (const entry of entries) {
      const result = results.filter({ hasText: entry.title })

      await expect(result).toHaveAttribute('href', entry.path)
      await expect(result.locator('[data-site-search-result-description]')).toHaveText(entry.description)
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect(page.locator('[data-site-search-result-arrow]:visible')).toHaveCount(3)
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        for (const row of await results.all()) {
          await row.scrollIntoViewIfNeeded()
          const measurements = await row.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            const arrow = element.querySelector('[data-site-search-result-arrow]')
            const arrowBounds = arrow?.getBoundingClientRect()
            const clippedCopy = [...element.querySelectorAll('[data-site-search-result-title], [data-site-search-result-description]')].some(copy => {
              const range = document.createRange()

              range.selectNodeContents(copy)
              const box = copy.getBoundingClientRect()

              return [...range.getClientRects()].some(rect => rect.width > 0 && (
                rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1 ||
                rect.top < box.top - 1 || rect.bottom > box.bottom + 1
              ))
            })

            return {
              clippedCopy,
              arrowInsets: arrowBounds?.width ?
                [{ end: bounds.right - arrowBounds.right, bottom: bounds.bottom - arrowBounds.bottom }] :
                []
            }
          })

          expect(measurements.clippedCopy, `Result copy must fit at ${width}px / ${size}%`).toBe(false)
          for (const inset of measurements.arrowInsets) {
            expect(inset.end).toBeGreaterThanOrEqual(16)
            expect(inset.bottom).toBeGreaterThanOrEqual(20)
          }
        }
        const panel = page.locator('[data-site-search-panel]')

        expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      }
    }
    expect((await new AxeBuilder({ page }).include('#site-search-dialog').analyze()).violations).toEqual([])
  })
}
