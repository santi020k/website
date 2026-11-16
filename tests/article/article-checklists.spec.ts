import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const route = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const labels = ['Entry:', 'Order:', 'Visibility:', 'Activation:', 'Dialogs:', 'Forms:', 'Dynamic states:', 'Navigation:', 'Content access:']

for (const width of [320, 390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`Article checklist at ${width}px in ${theme}`, () => {
      test.use({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' })

      test('keeps the complete numbered checklist readable at normal and enlarged text sizes', async ({ page }) => {
        await page.goto(route)
        await page.evaluate(() => document.fonts.ready)
        const list = page.locator('[data-checklist-ledger]')
        await expect(list).toHaveRole('list')
        await expect(list).toHaveCSS('list-style-type', 'decimal')
        await expect(list.getByRole('listitem')).toHaveCount(9)
        await expect(list.locator('[data-checklist-ledger-lead]')).toHaveText(labels)
        await expect(list.locator('[data-checklist-ledger-detail]')).toHaveCount(9)
        for (const size of [100, 200]) {
          await page.evaluate(value => {
            document.documentElement.style.fontSize = `${value}%`
          }, size)
          const problems = await list.locator('[data-checklist-ledger-row]').evaluateAll(rows => rows.flatMap(row => {
            const lead = row.querySelector('[data-checklist-ledger-lead]')?.getBoundingClientRect()
            const detail = row.querySelector('[data-checklist-ledger-detail]')?.getBoundingClientRect()
            const overlap = lead && detail && lead.right > detail.left + 1 && lead.bottom > detail.top + 1
            const clipped = row.scrollWidth > row.clientWidth + 1
            return overlap || clipped ? [row.textContent] : []
          }))
          expect(problems).toEqual([])
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        }
        const scan = await new AxeBuilder({ page }).include('[data-checklist-ledger]').analyze()
        expect(scan.violations).toEqual([])
      })
    })
  }
}

test('keeps ordinary article lists and project ledger composition independent', async ({ page }) => {
  await page.goto('/blog/responsive-design-standards-that-scale-across-components/')
  await expect(page.locator('[data-checklist-ledger]')).toHaveCount(0)
  await expect(page.locator('[data-article-prose] > ul').first()).toHaveCSS('list-style-type', 'disc')
  await page.goto('/portfolio/smith-commerce/')
  await expect(page.locator('[data-checklist-ledger]')).toHaveCount(0)
  await expect(page.locator('[data-project-ledger]').first().getByRole('listitem')).toHaveCount(4)
  await expect(page.locator('[data-project-ledger-split]').first()).toBeVisible()
})

test.describe('Article checklist without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('renders every label and explanation in reading order', async ({ page }) => {
    await page.goto(route)
    const list = page.locator('[data-checklist-ledger]')
    await expect(list.locator('[data-checklist-ledger-lead]')).toHaveText(labels)
    await expect(list.locator('[data-checklist-ledger-detail]').last()).toContainText('Inspect the page at 200% zoom')
  })
})
