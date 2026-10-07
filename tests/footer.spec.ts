import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('footer preserves contact destinations, profile identity, and keyboard navigation', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('[data-site-footer]')
  const contact = footer.locator('.maker-footer-action')
  await expect(contact).toHaveAccessibleName('Let’s talk')
  await expect(contact).toHaveAttribute('href', /^https:\/\/api\.whatsapp\.com\/send\?/)
  await expect(contact).toHaveAttribute('rel', /noopener/)
  await expect(footer.locator('a[href="mailto:hi@santi020k.com"]')).toBeVisible()
  await expect(footer.locator('a[href="https://santi020k.com"]')).toHaveAccessibleName('Santiago Molina — santi020k')
  await expect(footer.locator('a[href="https://github.com/santi020k"]')).toHaveAttribute('rel', /\bme\b/)

  await contact.focus()
  await expect(contact).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(footer.locator('a[href="mailto:hi@santi020k.com"]')).toBeFocused()
  await footer.locator('a[href="/about/"]').click()
  await expect(page).toHaveURL(/\/about\/$/)
  await expect(footer.locator('a[aria-current="page"]')).toHaveText('About')
})

test('compact footer keeps the directory and legal links without a repeated contact pitch', async ({ page }) => {
  await page.goto('/privacy/')
  const footer = page.locator('[data-site-footer]')
  await expect(footer).toHaveAttribute('data-variant', 'compact')
  await expect(footer.locator('#footer-heading')).toHaveCount(0)
  await expect(footer.locator('a[href="/speaking/"]')).toBeVisible()
  await expect(footer.locator('a[href="/resume/"]')).toBeVisible()
  await expect(footer.locator('a[aria-current="page"]')).toHaveText('Privacy')
})

for (const theme of ['light', 'dark']) {
  test(`footer has readable, accessible layouts in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const footer = page.locator('[data-site-footer]')
      await footer.scrollIntoViewIfNeeded()
      for (const element of await footer.locator('a, h2').all()) {
        const bounds = await element.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds?.x).toBeGreaterThanOrEqual(0)
        expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
      }
      await expectNoUnexpectedAccessibilityViolations(page)
    }
  })
}
