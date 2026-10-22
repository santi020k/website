import { expect, test } from '@playwright/test'

import { YEARS_OF_EXPERIENCE } from '../src/site.config'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const highlights = [
  {
    label: 'Experience',
    value: `${YEARS_OF_EXPERIENCE} years`,
    description: 'Building web, mobile, backend, automation, and developer experience systems.'
  },
  {
    label: 'Team leadership',
    value: '14 people',
    description: 'Largest cross-functional team led across product, design, frontend, and backend.'
  },
  {
    label: 'Delivery systems',
    value: '-75%',
    description: 'Release lead-time reduction through CI/CD and quality-gate automation.'
  }
]

for (const theme of ['light', 'dark'] as const) {
  test(`About profile highlights keep metrics and context readable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/about/')
    const section = page.getByRole('region', { name: 'Profile highlights' })
    const articles = section.getByRole('article')

    await expect(articles).toHaveCount(highlights.length)
    for (const highlight of highlights) {
      const article = section.getByRole('article', { name: highlight.label })

      await expect(article.getByRole('heading', { level: 2 })).toHaveText(highlight.label)
      await expect(article.locator('.about-stat-value')).toHaveText(highlight.value)
      await expect(article.locator('[data-about-stat-description]')).toHaveText(highlight.description)
    }
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

        expect(overflow, `Profile highlights at ${width}px and ${size}% must fit`).toEqual([])
        const overlaps = await articles.evaluateAll(rows => rows.some(row => {
          const value = row.querySelector('.about-stat-value')?.getBoundingClientRect()
          const copy = row.querySelector('[data-about-stat-copy]')?.getBoundingClientRect()

          return value && copy && value.right > copy.left + 1 && value.bottom > copy.top + 1
        }))

        expect(overlaps, 'Figures must not overlap their explanations').toBe(false)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
