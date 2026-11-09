import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const javaScriptEnabled of [true, false]) {
  for (const theme of ['light', 'dark']) {
    test(`outcome context trail reaches its client chapters in ${theme} with JavaScript ${javaScriptEnabled}`, async ({ browser, browserName }) => {
      const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' })
      const page = await context.newPage()

      try {
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 900 })
          await page.goto('/portfolio/smith-commerce/#key-outcomes')
          await page.evaluate(value => {
            document.documentElement.dataset.theme = `santi020k-${value}`
          }, theme)
          const trail = page.getByRole('navigation', { name: 'Explore Marcone', exact: true })

          await expect(trail.getByRole('link')).toHaveText(['Before and after', 'Technical highlights'])
          await trail.getByRole('link').first().focus()
          await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
          await expect(trail.getByRole('link').last()).toBeFocused()

          for (const [label, id] of [['Before and after', 'before-and-after'], ['Technical highlights', 'technical-highlights']] as const) {
            const link = trail.getByRole('link', { name: label, exact: true })

            await expect(link).toHaveAttribute('href', `#${id}`)
            await expect(link).not.toHaveAttribute('target')
            await link.focus()
            expect(await link.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
            const size = await link.boundingBox()

            expect(size?.height).toBeGreaterThanOrEqual(44)
            await link.press('Enter')
            await expect(page).toHaveURL(new RegExp(`#${id}$`, 'u'))
            const heading = page.locator(`h3#${id}`)

            await expect(heading).toBeInViewport()
            const headerBottom = await page.locator('.site-header').evaluate(element => element.getBoundingClientRect().bottom)

            // Native fragment scrolling rounds to whole pixels; layout boxes retain fractions.
            expect((await heading.boundingBox())?.y).toBeGreaterThanOrEqual(headerBottom - 0.5)
          }
        }
      } finally {
        await context.close()
      }
    })
  }
}

for (const theme of ['light', 'dark']) {
  test(`outcome context trail remains accessible with enlarged text in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/portfolio/smith-commerce/#key-outcomes')
    await page.evaluate(value => {
      document.documentElement.dataset.theme = `santi020k-${value}`
      document.documentElement.style.fontSize = '200%'
    }, theme)
    await page.evaluate(() => document.fonts.ready)
    const result = await new AxeBuilder({ page }).include('[data-project-outcomes]').analyze()

    expect(result.violations).toEqual([])
  })
}
