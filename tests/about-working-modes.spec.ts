import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const modes = [
  { title: 'Architecture', description: 'Architecture and modernization for products that need to keep shipping.' },
  { title: 'Delivery systems', description: 'Developer experience, automation, testing, linting, and CI/CD systems that reduce review noise.' },
  { title: 'Technical leadership', description: 'Technical leadership for teams that need clearer standards and calmer decisions under pressure.' }
]

for (const theme of ['light', 'dark'] as const) {
  test(`About working modes preserve complete, readable descriptions in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/about/')
    const section = page.getByRole('region', { name: 'Where I usually help.' })
    const items = section.getByRole('list').getByRole('listitem')

    await expect(section.getByRole('heading', { level: 3 })).toHaveText('Where I usually help.')
    await expect(items).toHaveCount(modes.length)
    for (const [index, mode] of modes.entries()) {
      await expect(items.nth(index).getByRole('heading', { level: 4 })).toHaveText(mode.title)
      await expect(items.nth(index).locator('p')).toHaveText(mode.description)
    }

    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)

        const overflow = await section.evaluate(element => {
          const outside: string[] = []
          const bounds = element.getBoundingClientRect()

          for (const copy of element.querySelectorAll('h3, h4, p')) {
            const range = document.createRange()
            const row = copy.closest('li')?.getBoundingClientRect() ?? bounds

            range.selectNodeContents(copy)
            if ([...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, row.left) - 1 ||
              rect.right > Math.min(innerWidth, row.right) + 1 ||
              rect.bottom > row.bottom + 1
            ))) outside.push(copy.textContent)
          }
          return outside
        })

        expect(overflow, `Working modes at ${width}px and ${size}% must fit`).toEqual([])
        const overlaps = await items.evaluateAll(rows => rows.some(row => {
          const index = row.querySelector('span')?.getBoundingClientRect()
          const copy = row.querySelector('div')?.getBoundingClientRect()

          return index && copy && index.right > copy.left + 1 && index.bottom > copy.top + 1
        }))

        expect(overlaps, 'The decorative number must not overlap the reading column').toBe(false)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
