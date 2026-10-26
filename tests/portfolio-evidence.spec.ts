import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const width of [320, 768, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Portfolio evidence retains claims and navigation at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.goto('/portfolio/')
      const cards = page.locator('[data-portfolio-project]')
      const voidCard = cards.filter({ has: page.getByRole('heading', { name: 'Void.GG', exact: true }) })
      const smithCard = cards.filter({ has: page.getByRole('heading', { name: 'Smith Commerce', exact: true }) })
      const postlensCard = cards.filter({ has: page.getByRole('heading', { name: 'PostLens', exact: true }) })
      const xgamesCard = cards.filter({ has: page.getByRole('heading', { name: 'X Games', exact: true }) })

      await expect(cards).toHaveCount(7)
      await expect(voidCard.locator('[data-portfolio-value]')).toHaveText('35%')
      await expect(voidCard.locator('[data-portfolio-label]')).toHaveText('Better system performance')
      await expect(voidCard.getByText('35% better system performance', { exact: true })).toHaveClass('sr-only')
      await expect(xgamesCard.locator('[data-portfolio-value]')).toHaveText('56+')
      await expect(smithCard.locator('[data-portfolio-value]')).toHaveText(['35 → 98', '75% less'])
      await expect(smithCard.locator('[data-portfolio-label]')).toHaveText([
        'Marcone: Lighthouse score', 'Marcone: Time to Interactive'
      ])
      await expect(postlensCard.locator('[data-portfolio-value]')).toHaveCount(0)
      await expect(postlensCard.locator('[data-portfolio-label]')).toHaveText(
        'Keeps core photo analysis, scoring, editing, and caption preparation on the device'
      )

      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, fontSize)
        for (const card of await cards.all()) {
          await expect(card.getByRole('list', { name: 'Project outcomes' })).toBeVisible()
          const link = card.getByRole('link')
          await expect(link).toHaveCount(1)
          await expect(link).toHaveAccessibleName(/^Read case study: /u)
          await link.focus()
          await expect(link).toBeFocused()
          await expect(card).toHaveCSS('outline-style', 'solid')
          const evidenceFits = await card.locator('[data-portfolio-outcomes]').evaluate(element => {
            const items = [element, ...element.querySelectorAll('li, [data-portfolio-value], [data-portfolio-label]')]
            return items.every(item => item.scrollWidth <= item.clientWidth + 1)
          })
          expect(evidenceFits).toBe(true)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }

      await expectNoUnexpectedAccessibilityViolations(page)
      await voidCard.getByRole('link').focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/portfolio\/void\/$/u)
    })
  }
}
