import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const seriesArticle = '/blog/responsive-design-standards-that-scale-across-components/'
const standaloneArticle = '/blog/building-roadscore-offline-road-trip-game/'
const mediumArticle = '/blog/atomic-module-component-structure-for-react/'

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`series byline remains readable and keyboard usable at ${width}px, ${textSize}% text, ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto(seriesArticle)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const actions = page.locator('[data-series-byline]')
        const series = actions.getByRole('link', { name: 'The santi020k way', exact: true })
        const copy = actions.getByRole('button', { name: 'Copy link to article', exact: true })

        await expect(actions).toContainText('From the series · Post 6 of 14')
        await expect(actions.getByRole('link')).toHaveCount(1)
        await expect(series).toHaveAttribute('href', '/blog/series/the-santi020k-way/')
        await expect(copy).toBeVisible()
        const fits = await actions.evaluate(element => {
          const controls = [...element.querySelectorAll('a, button')]
          const bounds = element.getBoundingClientRect()

          return document.documentElement.scrollWidth <= innerWidth && controls.every(control => {
            const rect = control.getBoundingClientRect()

            return rect.left >= bounds.left && rect.right <= bounds.right + 1 &&
              rect.height >= 44 && control.scrollWidth <= control.clientWidth + 1
          })
        })

        expect(fits).toBe(true)
        await page.keyboard.press('Tab')
        await series.focus()
        await expect(series).toHaveCSS('outline-style', 'solid')
        expect(await series.evaluate(element => element.getClientRects().length)).toBe(1)
        await page.keyboard.press('Tab')
        await expect(copy).toBeFocused()
        await expect(copy).toHaveCSS('outline-style', 'solid')
        const scan = await new AxeBuilder({ page }).include('[data-series-byline]').analyze()

        expect(scan.violations).toEqual([])
        await series.press('Enter')
        await expect(page).toHaveURL('/blog/series/the-santi020k-way/')
      })
    }
  }
}

test('standalone articles keep the quiet copy action without series metadata', async ({ page }) => {
  await page.goto(standaloneArticle)
  const actions = page.locator('[data-series-byline]')

  await expect(actions.getByRole('button', { name: 'Copy link to article' })).toBeVisible()
  await expect(actions.locator('[data-hero-series]')).toHaveCount(0)
  await expect(actions.getByRole('link')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Blog' })).toBeVisible()
})

test('Medium articles retain their original destination beside the series byline', async ({ page }) => {
  await page.goto(mediumArticle)
  const actions = page.locator('[data-series-byline]')
  const medium = actions.getByRole('link', { name: 'Read on Medium' })

  await expect(actions.locator('[data-hero-series-link]')).toBeVisible()
  await expect(actions.locator('[data-hero-series-position]')).toContainText('From the series · Post')
  await expect(medium).toHaveAttribute('href', 'https://medium.com/@santi020k/atomic-module-component-structure-for-react-34464b05832c')
  await expect(medium).toHaveAttribute('target', '_blank')
  await expect(medium).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(actions.getByRole('button')).toHaveCount(0)
})

test('series and Medium destinations remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(seriesArticle)
  const actions = page.locator('[data-series-byline]')

  await expect(actions.getByRole('button', { name: 'Copy link to article' })).toHaveCount(0)
  await actions.getByRole('link', { name: 'The santi020k way' }).click()
  await expect(page).toHaveURL('/blog/series/the-santi020k-way/')
  await page.goto(mediumArticle)
  await expect(page.locator('[data-series-byline]').getByRole('link', { name: 'Read on Medium' })).toBeVisible()
  await context.close()
})
