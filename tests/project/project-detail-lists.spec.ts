import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const width of [320, 390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Project detail lists at ${width}px, ${textSize}% text, ${theme}`, () => {
        test.use({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('keep Markdown and MDX content readable in the ledger', async ({ page }) => {
          await page.addInitScript(size => {
            document.addEventListener('DOMContentLoaded', () => {
              document.documentElement.style.fontSize = `${size}%`
            })
          }, textSize)

          for (const route of ['/portfolio/smith-commerce/', '/portfolio/datagran/', '/portfolio/void/']) {
            await page.goto(route)
            await page.evaluate(() => document.fonts.ready)
            const list = page.locator('[data-project-ledger]').first()

            await expect(list).toHaveRole('list')
            expect(await list.getByRole('listitem').count()).toBeGreaterThan(0)
            const problems = await page.locator('[data-project-ledger-row]').evaluateAll(rows => rows.flatMap(row => {
              const bounds = row.getBoundingClientRect()
              const lead = row.querySelector('[data-project-ledger-lead]')?.getBoundingClientRect()
              const detail = row.querySelector('[data-project-ledger-detail]')?.getBoundingClientRect()
              const overlaps = lead && detail && lead.right > detail.left + 1 && lead.bottom > detail.top + 1
              const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT)
              const clipped: string[] = []
              let node = walker.nextNode()

              while (node) {
                if (node.textContent?.trim()) {
                  const range = document.createRange()
                  range.selectNodeContents(node)
                  if ([...range.getClientRects()].some(rect => rect.width > 0 && (
                    rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1
                  ))) clipped.push(node.textContent.trim())
                }
                node = walker.nextNode()
              }
              return overlaps || clipped.length ? [{ text: row.textContent, overlaps, clipped }] : []
            }))

            expect(problems).toEqual([])
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          }
        })
      })
    }
  }
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Project list semantics in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('preserves claims, code, safe links, and keyboard focus', async ({ page }) => {
      await page.goto('/portfolio/smith-commerce/')
      const first = page.locator('[data-project-ledger]').first()
      await expect(first.getByRole('listitem')).toHaveCount(4)
      await expect(first.locator('code')).toHaveText(['Next.js 15', 'React 19', 'TypeScript', 'Radix UI', 'TanStack Query', 'Zod'])
      const outcomes = page.locator('[data-project-outcomes]')
      await expect(outcomes.getByText('Marcone: Lighthouse score improved from 35 to 98', { exact: true })).toHaveCount(1)
      await expect(page.locator('[data-project-ledger-row]').filter({ hasText: 'Lighthouse score improved' })).toHaveCount(0)
      const scan = await new AxeBuilder({ page }).include('[data-project-ledger]').analyze()
      expect(scan.violations).toEqual([])

      await page.goto('/portfolio/santi020k-theme/')
      const link = page.locator('[data-project-ledger]').getByRole('link', { name: 'VS Code', exact: true })
      await link.focus()
      await expect(link).toBeFocused()
      await expect(link).toHaveAttribute('href', 'https://theme.santi020k.com/vscode/')
      await expect(link).toHaveAttribute('rel', /noopener/u)
      await expect(link).toHaveAttribute('rel', /noreferrer/u)
      await expect(link).toHaveCSS('outline-style', 'solid')
    })
  })
}

test.describe('Project lists without client JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('render complete entries from Markdown and MDX', async ({ page }) => {
    for (const route of ['/portfolio/smith-commerce/', '/portfolio/void/']) {
      await page.goto(route)
      await expect(page.locator('[data-project-ledger]').first().getByRole('listitem')).toHaveCount(4)
      await expect(page.locator('[data-project-ledger-lead]').first()).toBeVisible()
      await expect(page.locator('[data-project-ledger-detail]').first()).toBeVisible()
    }
  })
})
