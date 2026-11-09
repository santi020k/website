import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const articlePath = '/blog/write-better-review-feedback-with-conventional-comments/'
const firstId = 'they-lower-social-friction'
const secondId = 'they-make-review-easier-to-scan'
const parentId = 'why-this-works-so-well'

test.use({ reducedMotion: 'reduce' })

for (const { locale, prefix, markerLabel, language, firstHeading, secondHeading } of [
  {
    locale: 'en',
    prefix: '',
    markerLabel: 'Linked section',
    language: 'en-US',
    firstHeading: 'They lower social friction',
    secondHeading: 'They make review easier to scan'
  },
  {
    locale: 'es',
    prefix: '/es',
    markerLabel: 'Sección enlazada',
    language: 'es-419',
    firstHeading: 'Reduce la fricción social',
    secondHeading: 'Facilita recorrer la revisión'
  }
]) {
  const article = `${prefix}${articlePath}`

  test(`${locale} subsection arrival follows contents, parent sections, history, and page transitions`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${article}#%74${firstId.slice(1)}`)
    const first = page.locator(`#${firstId}`)
    const second = page.locator(`#${secondId}`)
    const markers = page.locator('[data-section-arrival]:visible')
    const contents = page.locator('[data-post-desktop-toc]')

    await expect(first.getByText(markerLabel, { exact: true })).toBeVisible()
    await expect(first.locator('[data-section-arrival]')).toHaveAttribute('lang', language)
    await expect(first).toHaveAccessibleName(firstHeading)
    await expect(first.locator('button')).toHaveCount(0)
    await expect(markers).toHaveCount(1)

    await contents.locator(`a[href='#${parentId}']`).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`${article}#${parentId}`)
    await expect(first.locator('[data-section-arrival]')).toBeHidden()
    await expect(page.locator('[data-section-reference-row]').filter({ has: page.locator(`#${parentId}`) })
      .locator('[data-section-arrival]')).toBeVisible()
    await expect(markers).toHaveCount(1)

    await contents.locator(`a[href='#${secondId}']`).click()
    await expect(second.locator('[data-section-arrival]')).toBeVisible()
    await expect(markers).toHaveCount(1)
    await page.goBack()
    await expect(first.locator('[data-section-arrival]')).toBeHidden()
    await expect(second.locator('[data-section-arrival]')).toBeHidden()
    await page.goBack()
    await expect(first.locator('[data-section-arrival]')).toBeVisible()
    await page.goForward()
    await page.goForward()
    await expect(second.locator('[data-section-arrival]')).toBeVisible()

    await page.locator(`a[href='${prefix}/blog/git-best-practices-for-calm-collaboration/']`).first().click()
    await expect(page).toHaveURL(`${prefix}/blog/git-best-practices-for-calm-collaboration/`)
    await page.goBack()
    await expect(page).toHaveURL(`${article}#${secondId}`)
    await expect(second.locator('[data-section-arrival]')).toHaveCount(1)
    await expect(second.locator('[data-section-arrival]')).toBeVisible()
    await expect(second).toHaveAccessibleName(secondHeading)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} subsection arrival stays readable in ${theme} and preserves print typography`, async ({ page }) => {
      const errors: string[] = []

      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(theme => {
        localStorage.setItem('theme', theme)
      }, theme)
      await page.goto(article)
      const heading = page.locator(`#${firstId}`)
      const marker = heading.locator('[data-section-arrival]')

      for (const { width, size } of [
        { width: 320, size: 100 },
        { width: 320, size: 200 },
        { width: 390, size: 100 },
        { width: 1440, size: 100 }
      ]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
          window.location.hash = 'main'
        }, size)
        await page.evaluate(id => {
          window.location.hash = id
        }, firstId)
        await expect(marker).toBeVisible()
        await expect(heading).toHaveAccessibleName(firstHeading)
        await expect.poll(() => heading.evaluate(element => {
          const label = element.querySelector('[data-section-arrival]')?.getBoundingClientRect()
          const header = document.querySelector('.site-header')?.getBoundingClientRect()
          const rect = element.getBoundingClientRect()

          return Boolean(label && header && label.top >= header.bottom - 1 &&
            label.bottom < rect.bottom && label.right <= rect.right &&
            element.scrollWidth <= element.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth)
        })).toBe(true)
      }
      const a11y = await new AxeBuilder({ page }).include('[data-subsection-arrival]').analyze()

      expect(a11y.violations).toEqual([])
      await page.emulateMedia({ media: 'print' })
      await expect(marker).toBeHidden()
      await expect(heading).toHaveCSS('border-inline-start-width', '0px')
      await expect(heading).toHaveCSS('padding-inline-start', '0px')
      const printedSize = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize))

      // Engines can round computed font sizes to different fractional pixels.
      expect(Math.abs(printedSize - 14 * 96 / 72)).toBeLessThan(0.02)
      await page.emulateMedia({ media: 'screen' })
      await page.evaluate(() => {
        window.location.hash = '%'
      })
      await expect(marker).toBeHidden()
      expect(errors).toEqual([])
    })
  }

  test.describe(`${locale} subsections without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('retains native headings and fragment navigation', async ({ page }) => {
      await page.goto(`${article}#${firstId}`)
      const heading = page.getByRole('heading', { level: 3, name: firstHeading, exact: true })

      await expect(heading).toBeInViewport()
      await expect(page.locator('[data-section-arrival]:visible')).toHaveCount(0)
      await expect(heading).toHaveCSS('border-inline-start-width', '0px')
    })
  })
}
