import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const seriesArticle = '/blog/responsive-design-standards-that-scale-across-components/'
const standaloneArticle = '/blog/building-roadscore-offline-road-trip-game/'
const mediumArticle = '/blog/atomic-module-component-structure-for-react/'
const tabKey = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
}

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      for (const path of [seriesArticle, standaloneArticle]) {
        test(`one closing share point keeps the opening readable at ${width}px, ${textSize}% text, ${theme}, ${path}`, async ({ page, browserName }) => {
          await page.setViewportSize({ width, height: 1000 })
          await page.emulateMedia({ colorScheme: theme })
          await page.goto(path)
          await page.evaluate(async size => {
            document.documentElement.style.fontSize = `${size}%`
            await document.fonts.ready
          }, textSize)
          const opening = page.locator('[data-article-opening]')
          const topics = opening.getByRole('navigation', { name: 'Topics' })
          const firstTopic = topics.getByRole('link').first()
          const sharing = page.locator('[data-article-closing] [data-share-card]')

          await expect(topics).toBeVisible()
          await expect(opening.locator('[data-share-url], [data-link-recovery], [data-article-utilities]')).toHaveCount(0)
          await expect(page.locator('#copy-link-btn')).toHaveCount(1)
          await expect(sharing.locator('#copy-link-btn')).toBeVisible()
          expect(await opening.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            return document.documentElement.scrollWidth <= innerWidth &&
              [...element.querySelectorAll('[data-topic-link], [data-hero-series-link]')].every(control => {
                const rect = control.getBoundingClientRect()
                return rect.left >= bounds.left && rect.right <= bounds.right + 1 &&
                  rect.height >= 44 && control.scrollWidth <= control.clientWidth + 1
              })
          })).toBe(true)
          await page.keyboard.press(tabKey[browserName])
          await firstTopic.focus()
          await expect(firstTopic).toHaveCSS('outline-style', 'solid')
          const scan = await new AxeBuilder({ page }).include('[data-article-opening]').include('[data-share-card]')
            .options({ rules: { 'label-content-name-mismatch': { enabled: true } } }).analyze()
          expect(scan.violations).toEqual([])
        })
      }
    }
  }
}

test('the series byline retains its destination and position without a sharing utility', async ({ page }) => {
  await page.goto(seriesArticle)
  const actions = page.locator('[data-series-byline]')
  const series = actions.getByRole('link', { name: 'The santi020k way', exact: true })

  await expect(actions).toContainText('From the series · Post 6 of 14')
  await expect(actions.getByRole('link')).toHaveCount(1)
  await expect(series).toHaveAttribute('href', '/blog/series/the-santi020k-way/')
  await expect(actions.getByRole('button')).toHaveCount(0)
  await series.focus()
  await series.press('Enter')
  await expect(page).toHaveURL('/blog/series/the-santi020k-way/')
})

test('standalone articles do not add an empty utility row', async ({ page }) => {
  await page.goto(standaloneArticle)
  await expect(page.locator('[data-series-byline], [data-article-utilities], [data-topic-action]')).toHaveCount(0)
  await expect(page.locator('[data-article-opening] > [data-reading-actions]')).toHaveCount(0)
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
  await expect(page.locator('[data-publication-reading]').getByRole('button', { name: 'Print article', exact: true })).toBeVisible()
  await expect(actions.getByRole('button')).toHaveCount(0)
})

test('series, publication and sharing destinations remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(seriesArticle)
  const actions = page.locator('[data-series-byline]')
  await expect(actions.getByRole('button')).toHaveCount(0)
  await expect(page.locator('[data-share-card]').getByRole('link')).toHaveCount(3)
  await actions.getByRole('link', { name: 'The santi020k way' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/blog/series/the-santi020k-way/')
  await page.goto(mediumArticle)
  await expect(page.locator('[data-series-byline]').getByRole('link', { name: 'Read on Medium' })).toBeVisible()
  await context.close()
})
