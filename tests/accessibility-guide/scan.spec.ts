import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  test(`article has no detected WCAG A/AA violations in ${theme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/blog/playwright-accessibility-checks-that-teams-keep-running/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', `santi020k-${theme}`)
    await page.evaluate(() => document.fonts.ready.then(() => undefined))

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    await testInfo.attach(`axe-${theme}`, {
      body: JSON.stringify({ violations: results.violations, incomplete: results.incomplete }, null, 2),
      contentType: 'application/json'
    })
    expect(results.violations).toEqual([])
  })
}
