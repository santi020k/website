import { expect, test } from '@playwright/test'

import { selectedOrganizations } from '../src/data/profile'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test(`organization names select their cards and stay readable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/about/')
    const carousel = page.locator('[data-organization-carousel]')
    const index = carousel.getByRole('navigation', { name: 'Choose an organization' })
    const buttons = index.getByRole('button')

    await expect(buttons).toHaveCount(selectedOrganizations.length)
    for (const [position, { label, projectId }] of selectedOrganizations.entries()) {
      const button = index.getByRole('button', { name: `${String(position + 1).padStart(2, '0')} ${label}`, exact: true })

      await button.focus()
      await page.keyboard.press('Enter')
      await expect(button).toBeFocused()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(index.locator('[aria-pressed="true"]')).toHaveCount(1)
      await expect(carousel.locator(`[data-carousel-item] a[href="/portfolio/${projectId}/"]`)).toBeVisible()
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 900 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        for (const button of await buttons.all()) {
          const geometry = await button.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            const range = document.createRange()

            range.selectNodeContents(element)
            return {
              height: bounds.height,
              fits: [...range.getClientRects()].every(rect => rect.width === 0 || (
                rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.bottom <= bounds.bottom + 1
              ))
            }
          })

          expect(geometry.height).toBeGreaterThanOrEqual(44)
          expect(geometry.fits, `Organization label must fit at ${width}px / ${size}%`).toBe(true)
        }
        const selected = index.locator('[aria-pressed="true"]')

        await selected.focus()
        await expect(selected).toHaveCSS('outline-style', 'solid')
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test.describe('Organization cards without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('keeps all case studies available without inactive selection controls', async ({ page }) => {
    await page.goto('/about/')
    const carousel = page.locator('[data-organization-carousel]')

    await expect(carousel.locator('[data-carousel-controls]')).toBeHidden()
    for (const { projectId } of selectedOrganizations) {
      await expect(carousel.locator(`[data-carousel-item] a[href="/portfolio/${projectId}/"]`)).toBeVisible()
    }
  })
})
