import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test(`Resume identity and downloads reflow without losing content in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/resume/')
    const header = page.locator('[data-resume-header]')
    const links = header.getByRole('link')

    await expect(header.getByRole('heading', { level: 1 })).toHaveText('Santiago Molina')
    await expect(links).toHaveCount(5)
    await expect(links.nth(1)).toHaveAttribute('rel', /noopener noreferrer/u)
    await expect(links.nth(2)).toHaveAttribute('rel', /noopener noreferrer/u)
    await links.first().focus()
    for (const link of await links.all()) {
      await expect(link).toBeFocused()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const overflow = await header.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h1, p, a')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, bounds.left) - 1 ||
              rect.right > Math.min(innerWidth, bounds.right) + 1 ||
              rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        })

        expect(overflow, `Profile copy must fit at ${width}px and ${size}%`).toEqual([])
        for (const link of await links.all()) {
          await expect(link).toBeVisible()
          expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('Resume print preserves identity and contacts while hiding screen-only actions', async ({ page }) => {
  await page.goto('/resume/')
  await page.emulateMedia({ media: 'print' })
  const header = page.locator('[data-resume-header]')

  await expect(header.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(header.getByRole('link')).toHaveCount(3)
  await expect(header.locator('[data-resume-downloads]')).toBeHidden()
  await expect(header.locator('[data-resume-contacts] > p:last-child')).toBeHidden()
  for (const icon of await header.locator('[data-resume-contacts] > p svg').all()) await expect(icon).toBeHidden()
})
