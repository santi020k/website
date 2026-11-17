import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const englishTitle = 'Playwright Accessibility Checks That Teams Keep Running'
const spanishTitle = 'Verificaciones de accesibilidad con Playwright que los equipos siguen ejecutando'

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Spanish publication imprint fits the reading details at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.goto(`/es${article}`)
      const imprint = page.locator('[data-publication-imprint]')
      const reading = imprint.locator('[data-publication-reading]')

      await expect(reading.locator('[data-article-language]')).toHaveCount(0)
      await expect(page.locator('h1')).toHaveAttribute('lang', 'es')
      await expect(page.locator('[data-editorial-summary]')).toHaveAttribute('lang', 'es')
      await expect(page.locator('[data-article-prose]')).toHaveAttribute('lang', 'es')
      const accessibility = await new AxeBuilder({ page })
        .include('[data-publication-imprint]')
        .include('[data-language-switch="header"]')
        .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
        .analyze()
      expect(accessibility.violations).toEqual([])

      for (const size of ['100%', '200%']) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        await expect(reading).toBeVisible()
        expect(await reading.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return bounds.left >= 0 && bounds.right <= innerWidth && element.scrollWidth <= element.clientWidth + 1
        })).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    })
  }
}

test('the language switch translates the article and preserves its query and section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`${article}?source=reader#test-the-whole-dialog-focus-cycle`)
  const languageSwitch = page.locator('[data-language-switch="header"]')

  await expect(page.locator('[data-article-language]')).toHaveCount(0)
  await expect(languageSwitch).toHaveAccessibleName('ES: Site interface in Spanish')
  await expect(languageSwitch).toHaveAttribute('lang', 'en')
  await expect(languageSwitch).toHaveAttribute('hreflang', 'es')
  await languageSwitch.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(`/es${article}?source=reader#test-the-whole-dialog-focus-cycle`)
  await expect(page.locator('h1')).toHaveText(spanishTitle)
  await expect(page.locator('[data-article-prose]')).toHaveAttribute('lang', 'es')
  await expect(page.locator('[data-article-language]')).toHaveCount(0)
  await expect(languageSwitch).toHaveAccessibleName('EN: Interfaz en inglés')
  await expect(languageSwitch).toHaveAttribute('lang', 'es')
  await expect(languageSwitch).toHaveAttribute('hreflang', 'en')
  await languageSwitch.click()
  await expect(page).toHaveURL(`${article}?source=reader#test-the-whole-dialog-focus-cycle`)
  await expect(page.locator('h1')).toHaveText(englishTitle)
  await expect(page.locator('[data-article-language]')).toHaveCount(0)
})

test('the mobile menu uses the same precise interface label', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/es${article}`)
  await page.locator('[data-mobile-nav-toggle]').click()
  const languageSwitch = page.locator('[data-language-switch="menu"]')

  await expect(languageSwitch).toHaveText('Interfaz en inglés')
  await languageSwitch.click()
  await expect(page).toHaveURL(article)
  await expect(page.locator('[data-article-language]')).toHaveCount(0)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('translated content and native language links remain available', async ({ page }) => {
    await page.goto(`/es${article}`)
    await expect(page.locator('h1')).toHaveText(spanishTitle)
    await expect(page.locator('[data-article-prose]')).toHaveAttribute('lang', 'es')
    await expect(page.locator('[data-article-language]')).toHaveCount(0)
    await expect(page.locator('[data-language-switch="header"]')).toHaveAttribute('href', article)
    await page.goto(article)
    await expect(page.locator('h1')).toHaveText(englishTitle)
  })
})
