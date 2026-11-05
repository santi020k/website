import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`Sculpted evidence ledger reflows and stays accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/technologies/#technology-summary-heading')
    const summary = page.locator('[data-technology-summary]')
    const link = summary.getByRole('link')

    await expect(summary.getByRole('heading', { level: 2 })).toHaveText('Range, with a trail.')
    await expect(summary.getByRole('heading', { level: 3 })).toHaveText('TypeScript')
    await expect(summary.locator('[data-technology-summary-ledger]')).toHaveCSS('border-bottom-right-radius', '8px')
    await link.focus()
    await expect(link).toBeFocused()
    await expect(link).toHaveCSS('outline-style', 'solid')
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const overflow = await summary.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h2,h3,p,a,[data-technology-summary-number]')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        })

        expect(overflow, `Summary at ${width}px and ${size}% text`).toEqual([])
      }
    }
    await page.keyboard.press('Tab')
    for (const { state, activate } of [
      { state: 'rest', activate: () => page.mouse.move(0, 0) },
      { state: 'hover', activate: () => link.hover() },
      { state: 'focus', activate: () => link.focus() }
    ]) {
      await activate()
      const audit = await new AxeBuilder({ page }).include('[data-technology-summary]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

      expect(audit.violations, `Summary contrast in ${state}`).toEqual([])
    }
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/technologies\/typescript\/$/u)
  })
}

test('Index statistics retain full-portfolio scope while the catalog is filtered', async ({ page }) => {
  await page.goto('/technologies/')
  const summary = page.locator('[data-technology-summary]')
  const total = await summary.locator('[data-technology-summary-number]').textContent()

  await page.getByRole('searchbox', { name: 'Find a technology' }).fill('TypeScript')
  await expect(page.locator('[data-technology-result-count]')).toHaveText('1')
  await expect(summary.locator('[data-technology-summary-number]')).toHaveText(total ?? '')
  await expect(summary).toContainText('Across the published portfolio.')
  await expect(summary.getByRole('link')).toHaveAttribute('href', '/technologies/typescript/')
})

test('Evidence link works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/technologies/#technology-summary-heading')
    await page.locator('[data-technology-summary]').getByRole('link').click()
    await expect(page).toHaveURL(/\/technologies\/typescript\/$/u)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('TypeScript In practice.')
  } finally {
    await context.close()
  }
})
