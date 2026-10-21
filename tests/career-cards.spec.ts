import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 768, 1440]) {
    for (const textSize of [100, 200]) {
      test(`career folios preserve dates and content at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.goto('/work/')
        await page.evaluate(size => {
          document.documentElement.style.fontSize = `${size}%`
        }, textSize)
        await page.evaluate(() => document.fonts.ready)
        const rows = page.locator('[data-timeline-row]')

        expect(await rows.count()).toBeGreaterThan(1)
        await expect(rows.first().locator('[data-career-date]')).toHaveText('May 2025 - Present')
        await expect(rows.first().locator('time')).toHaveAttribute('datetime', '2025-05-01')
        await expect(rows.filter({ hasText: 'Completed' }).first().locator('time')).toHaveCount(2)
        for (const row of await rows.all()) {
          const link = row.locator('[data-career-link]')

          await expect(link).toHaveAttribute('href', /^\/portfolio\/.+\/$/u)
          await expect(row.locator('[data-career-action]')).toHaveText('Read case study')
          const clipped = await link.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('[data-career-date], [data-career-title], [data-career-role], [data-career-description], [data-career-footer]')].some(child => {
              const rect = child.getBoundingClientRect()
              const style = getComputedStyle(child)

              return rect.left < bounds.left - 1 || rect.right > bounds.right + 1 ||
                rect.bottom > bounds.bottom + 1 || child.scrollWidth > child.clientWidth + 1 ||
                style.webkitLineClamp !== 'none'
            })
          })

          expect(clipped, 'Every date, title, description, and action remains fully visible').toBe(false)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      })
    }
  }
}

test('career cards retain keyboard navigation, focus, and reduced motion', async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' })
  await page.goto('/work/')
  const links = page.locator('[data-career-link]')

  await links.first().focus()
  await expect(links.first()).toHaveCSS('outline-style', 'solid')
  await expect(links.first()).toHaveCSS('outline-width', '2px')
  const duration = await links.first().locator('[data-career-title]').evaluate(element => Number.parseFloat(getComputedStyle(element).transitionDuration))

  expect(duration).toBeLessThanOrEqual(0.001)
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(links.nth(1)).toBeFocused()
  const destination = await links.nth(1).getAttribute('href')

  await page.keyboard.press('Enter')
  await expect.poll(() => new URL(page.url()).pathname).toBe(destination)
})
