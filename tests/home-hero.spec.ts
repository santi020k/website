import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('the hero connects products, personal background, and the full portfolio', async ({ page }) => {
  await page.goto('/')

  const hero = page.locator('[data-home-hero]')

  await expect(page.locator('h1')).toHaveCount(1)
  await expect(hero.locator('h1')).toContainText('I build products.')
  await expect(hero.locator('a[href="/portfolio/"]')).toHaveAccessibleName('Explore my work')
  await expect(hero.locator('a[href="/portfolio/"]')).toHaveAttribute('href', '/portfolio/')
  await expect(hero.locator('a[href="/portfolio/lumen-ui/"]')).toHaveAttribute('href', '/portfolio/lumen-ui/')
  await expect(hero.locator('a[href="/portfolio/postlens/"]')).toHaveAttribute('href', '/portfolio/postlens/')
  await expect(hero.locator('img[alt="Portrait of Santiago Molina, smiling"]')).toBeVisible()
  await expect(hero.locator('img[alt="Portrait of Santiago Molina, smiling"]')).toHaveJSProperty('complete', true)

  await hero.locator('a[href="/about/"]').click()
  await expect(page).toHaveURL(/\/about\/$/)
  await expect(page.locator('h1')).toContainText('Calm systems.')
  await expect(page.locator('img[alt="Portrait of Santiago Molina (@santi020k)"]')).toBeVisible()
  await expect(page.locator('[data-about-hero] a[href="/resume/"]')).toHaveAttribute('href', '/resume/')

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(hero).toBeVisible()
  await expect(page.locator('[data-particles-bg]')).toBeVisible()
})

for (const theme of ['light', 'dark']) {
  test(`hero remains usable at mobile, tablet, and desktop widths in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    for (const width of [320, 375, 640, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })

      const hero = page.locator('[data-home-hero]')
      const heading = hero.locator('h1')
      const action = hero.locator('a[href="/portfolio/"]')
      const bounds = await heading.boundingBox()

      expect(bounds).not.toBeNull()
      expect(bounds?.x).toBeGreaterThanOrEqual(0)
      expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
      await expect(action).toBeVisible()
      await action.focus()
      await expect(action).toBeFocused()
      await expect(hero.locator('a[href="/about/"]')).toBeVisible()
    }

    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
