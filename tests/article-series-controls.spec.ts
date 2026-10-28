import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const overview = '/blog/series/building-a-production-nextjs-app/'

for (const prefix of ['', '/es']) {
  const caption = prefix ? 'De la serie · Artículo 8 de 8' : 'From the series · Post 8 of 8'
  const language = prefix ? 'es-419' : 'en-US'

  for (const width of [390, 1440]) {
    test(`the ${prefix || 'English'} hero series destination preserves language at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`${prefix}${article}`)
      const link = page.locator('[data-hero-series-link]')

      await expect(page.locator('[data-hero-series-position]')).toHaveText(caption)
      await expect(link).toHaveAttribute('href', `${prefix}${overview}`)
      await expect(link.locator('span[lang="en"]')).toHaveText('Building a Production Next.js App')
      await link.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${prefix}${overview}`)
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await page.goBack()
      await expect(page.locator('[data-hero-series-position]')).toHaveText(caption)
    })
  }
}

const expectCenteredIcon = async (button: Locator) => {
  const icons = button.locator('[data-copy-icon]:visible, [data-share-icon]:visible, [data-check-icon]:visible')
  await expect(icons).toHaveCount(1)
  expect(await button.evaluate(element => {
    const compartment = element.querySelector('[data-copy-action-icon]')
    const icon = [...element.querySelectorAll('[data-copy-icon], [data-share-icon], [data-check-icon]')]
      .find(candidate => candidate.getBoundingClientRect().width > 0)

    if (!compartment || !icon) return false

    const bounds = element.getBoundingClientRect()
    const slot = compartment.getBoundingClientRect()
    const glyph = icon.getBoundingClientRect()

    return bounds.height >= 44 && slot.right <= bounds.right - 8 &&
      Math.abs(glyph.x + glyph.width / 2 - slot.x - slot.width / 2) < 1 &&
      Math.abs(glyph.y + glyph.height / 2 - slot.y - slot.height / 2) < 1 &&
      glyph.width >= 18 && glyph.height >= 18
  })).toBe(true)
}

for (const theme of ['light', 'dark'] as const) {
  test(`copy controls keep one centered icon and visible retry feedback in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (text: string) => {
            if (sessionStorage.getItem('reject-copy')) return Promise.reject(new Error('Synthetic clipboard denial'))

            sessionStorage.setItem('copied-control-url', text)
            return Promise.resolve()
          }
        }
      })
    })
    await page.goto(`/es${article}`)
    for (const id of ['article-copy-link', 'copy-link-btn']) {
      const button = page.locator(`#${id}`)

      await expectCenteredIcon(button)
      await page.keyboard.press('Tab')
      await button.focus()
      await expect(button).toHaveCSS('outline-style', 'solid')
      await expect(button.locator('[data-copy-action-icon]')).toHaveCSS('transition-property', 'none')
      await button.press('Enter')
      await expect(button.locator('[data-check-icon]')).toBeVisible()
      await expectCenteredIcon(button)
      await page.evaluate(() => {
        sessionStorage.setItem('reject-copy', '1')
      })
      await button.click()
      await expect(button).toHaveAccessibleName('Intentar de nuevo')
      await expect(button.locator('[data-copy-icon]')).toBeVisible()
      await expectCenteredIcon(button)
      const retryBorder = await button.evaluate(element => getComputedStyle(element).borderColor)
      await page.mouse.move(0, 0)
      await button.blur()
      await button.hover()
      await expect(button).toHaveCSS('border-color', retryBorder)
      expect((await new AxeBuilder({ page }).include(`#${id}`).include(`#${id}-recovery`).analyze()).violations).toEqual([])
      await page.evaluate(() => {
        sessionStorage.removeItem('reject-copy')
      })
      await button.click()
      await expect(button.locator('[data-check-icon]')).toBeVisible()
      await expect(button).not.toHaveCSS('border-color', retryBorder)
      expect(await page.evaluate(() => sessionStorage.getItem('copied-control-url'))).toBe(`https://santi020k.com/es${article}`)
    }

    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      for (const id of ['article-copy-link', 'copy-link-btn']) await expectCenteredIcon(page.locator(`#${id}`))
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  })
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the Spanish series destination remains a native localized link', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/es${article}`)
    await page.locator('[data-hero-series-link]').focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`/es${overview}`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
  })
})
