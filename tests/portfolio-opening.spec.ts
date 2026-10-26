import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`case study paths remain readable and accessible at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.goto('/portfolio/')
      const opening = page.locator('.editorial-page-hero')
      const navigation = opening.getByRole('navigation', { name: 'Choose a case study collection' })
      const cards = page.locator('[data-portfolio-project]')
      const cardCount = await cards.count()

      await expect(opening.getByRole('heading', { level: 1 })).toHaveText('Work that shipped. Built to hold up.')
      await expect(opening.locator('.editorial-eyebrow')).toHaveText(`Selected portfolio / ${cardCount} case studies`)
      await expect(navigation.getByRole('link')).toHaveCount(2)
      await expect(opening.getByRole('link', { name: 'View work history', exact: true })).toHaveAttribute('href', '/work/')

      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, fontSize)
        for (const id of ['selected-work', 'independent-builds']) {
          const section = page.locator(`#${id}`)
          const path = navigation.locator(`a[href="#${id}"]`)
          const count = await section.locator('[data-portfolio-project]').count()
          await expect(path.locator('[data-portfolio-path-count]')).toHaveText(`${count} case studies`)
          await expect(path).not.toHaveAttribute('target', '_blank')
          expect(await path.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
          expect(await path.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
          await path.focus()
          await expect(path).toHaveCSS('outline-style', 'solid')
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(new RegExp(`/portfolio/#${id}$`, 'u'))
          await expect(section).toBeFocused()
          await expect(cards).toHaveCount(cardCount)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }
}

test.describe('Portfolio paths without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('opens both collections with native keyboard navigation at narrow enlarged text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/portfolio/')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    const navigation = page.getByRole('navigation', { name: 'Choose a case study collection' })
    for (const id of ['independent-builds', 'selected-work']) {
      await navigation.locator(`a[href="#${id}"]`).focus()
      await page.keyboard.press('Enter')
      await expect(page.locator(`#${id}`)).toBeFocused()
      await expect(page).toHaveURL(new RegExp(`/portfolio/#${id}$`, 'u'))
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    await expect(page.locator('[data-portfolio-project]')).toHaveCount(7)
  })
})
