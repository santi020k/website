import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const highlights = [
  { label: 'Professional roles', value: /^\d+$/u, description: 'Across commerce, gaming, agencies, and SaaS.' },
  { label: 'Largest team led', value: '14', description: 'Product, design, frontend, and backend.' },
  { label: 'Production technologies', value: /^\d+$/u, description: 'Tools chosen to fit the product.' },
  { label: 'Release cycle time', value: '−75%', description: 'Through CI/CD and automated quality gates.' }
]

for (const theme of ['light', 'dark'] as const) {
  test(`Work career highlights keep metrics and context readable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/work/')
    const section = page.getByRole('region', { name: 'Career at a glance' })
    const articles = section.getByRole('article')

    await expect(articles).toHaveCount(highlights.length)
    for (const highlight of highlights) {
      const article = section.getByRole('article', { name: highlight.label })

      await expect(article.getByRole('heading', { level: 2 })).toHaveText(highlight.label)
      await expect(article.locator('.work-stat-value')).toHaveText(highlight.value)
      await expect(article.locator('[data-work-stat-copy] > p')).toHaveText(highlight.description)
    }
    await expect(section.getByRole('article', { name: 'Professional roles' }).locator('.work-stat-value'))
      .toHaveText(String(await page.locator('[data-career-timeline] [data-timeline-row]').count()))
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const overflow = await articles.evaluateAll(rows => rows.flatMap(row => {
          const bounds = row.getBoundingClientRect()

          return [...row.querySelectorAll('h2, p')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, bounds.left) - 1 ||
              rect.right > Math.min(innerWidth, bounds.right) + 1 ||
              rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        }))

        expect(overflow, `Career at a glance at ${width}px and ${size}% must fit`).toEqual([])
        const overlaps = await articles.evaluateAll(rows => rows.some(row => {
          const value = row.querySelector('.work-stat-value')?.getBoundingClientRect()
          const copy = row.querySelector('[data-work-stat-copy]')?.getBoundingClientRect()

          return value && copy && value.right > copy.left + 1 && value.bottom > copy.top + 1
        }))

        expect(overlaps, 'Figures must not overlap their explanations').toBe(false)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
