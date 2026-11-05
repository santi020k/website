import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const articlePath = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const firstId = 'keyboard-testing-checklist'
const secondId = 'keep-the-checks-useful-in-ci'

test.use({ reducedMotion: 'reduce' })

for (const { locale, prefix, navigationLabel, backLabel, markerLabel, language } of [
  {
    locale: 'en',
    prefix: '',
    navigationLabel: 'Page-end navigation',
    backLabel: 'Back to top',
    markerLabel: 'Linked section',
    language: 'en-US'
  },
  {
    locale: 'es',
    prefix: '/es',
    navigationLabel: 'Navegación al final de la página',
    backLabel: 'Volver arriba',
    markerLabel: 'Sección enlazada',
    language: 'es-419'
  }
]) {
  const article = `${prefix}${articlePath}`

  test(`${locale} arrival follows section links and browser history while preserving copy destinations`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: (value: string) => {
          sessionStorage.setItem('arrival-copy', value)
          return Promise.resolve()
        } }
      })
    })
    const encodedId = `%6b${firstId.slice(1)}`

    await page.goto(`${article}#${encodedId}`)
    const first = page.locator('[data-section-reference-row]').filter({ has: page.locator(`#${firstId}`) })
    const second = page.locator('[data-section-reference-row]').filter({ has: page.locator(`#${secondId}`) })
    const markers = page.locator('[data-section-arrival]:visible')

    await expect(first.locator('[data-section-arrival]')).toBeVisible()
    await expect(markers).toHaveCount(1)
    await expect(first.locator('[data-section-arrival]')).toHaveText(markerLabel)
    await expect(first.locator('[data-section-arrival]')).toHaveAttribute('lang', language)
    await expect(first.getByRole('heading')).toHaveAccessibleName('Keyboard-testing checklist')
    await first.getByRole('button').click()
    expect(await page.evaluate(() => sessionStorage.getItem('arrival-copy'))).toBe(`https://santi020k.com${article}#${firstId}`)
    await expect(first.locator('[data-section-arrival]')).toBeVisible()

    await page.locator(`[data-post-desktop-toc] a[href='#${secondId}']`).click()
    await expect(page).toHaveURL(`${article}#${secondId}`)
    await expect(second.locator('[data-section-arrival]')).toBeVisible()
    await expect(first.locator('[data-section-arrival]')).toBeHidden()
    await page.goBack()
    await expect(first.locator('[data-section-arrival]')).toBeVisible()
    await page.goForward()
    await expect(second.locator('[data-section-arrival]')).toBeVisible()

    await page.getByRole('navigation', { name: navigationLabel, exact: true })
      .getByRole('link', { name: backLabel, exact: true }).click()
    await expect(markers).toHaveCount(0)
    await page.goto(`${article}#missing-section`)
    await expect(markers).toHaveCount(0)
    await page.goto(article)
    await expect(markers).toHaveCount(0)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} arrival fits narrow and enlarged text in ${theme} and disappears in print`, async ({ page }) => {
      const errors: string[] = []

      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(article)
      const row = page.locator('[data-section-reference-row]').filter({ has: page.locator(`#${firstId}`) })
      const marker = row.locator('[data-section-arrival]')

      for (const { width, textSize } of [
        { width: 320, textSize: 100 },
        { width: 320, textSize: 200 },
        { width: 390, textSize: 100 },
        { width: 1440, textSize: 100 }
      ]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
          window.location.hash = 'main'
        }, textSize)
        await page.evaluate(id => {
          window.location.hash = id
        }, firstId)
        await expect(marker).toBeVisible()
        await expect.poll(() => row.evaluate(element => {
          const marker = element.querySelector('[data-section-arrival]')?.getBoundingClientRect()
          const heading = element.querySelector('h2')?.getBoundingClientRect()
          const button = element.querySelector('button')?.getBoundingClientRect()
          const header = document.querySelector('.site-header')?.getBoundingClientRect()

          return Boolean(marker && heading && button && header && marker.top >= header.bottom - 1 &&
            marker.bottom <= heading.top + 1 && button.width >= 44 && button.height >= 44 &&
            (button.left >= heading.right - 1 || button.top >= heading.bottom - 1) &&
            element.scrollWidth <= element.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth)
        })).toBe(true)
      }
      const a11y = await new AxeBuilder({ page }).include('[data-section-reference-row]').analyze()

      expect(a11y.violations).toEqual([])
      await page.emulateMedia({ media: 'print' })
      await expect(marker).toBeHidden()
      await expect(row.getByRole('button')).toBeHidden()
      await expect(row.getByRole('heading')).toHaveCSS('border-inline-start-width', '0px')
      expect(await row.evaluate(element => {
        const heading = element.querySelector('h2')

        return heading !== null &&
          Math.abs(heading.getBoundingClientRect().width - element.getBoundingClientRect().width) < 1
      })).toBe(true)
      expect(errors).toEqual([])
    })
  }

  test.describe(`${locale} arrival without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('keeps native destinations without exposing inactive markers or controls', async ({ page }) => {
      await page.goto(`${article}#${firstId}`)
      await expect(page.locator(`#${firstId}`)).toHaveAccessibleName('Keyboard-testing checklist')
      await expect(page.locator(`#${firstId}`)).toBeInViewport()
      await expect(page.locator('[data-section-arrival]:visible')).toHaveCount(0)
      await expect(page.locator('[data-section-copy]:visible')).toHaveCount(0)
    })
  })
}
