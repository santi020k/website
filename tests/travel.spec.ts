import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const draftSlugs = [
  'how-i-became-a-digital-nomad',
  'working-from-a-city-everyday-life',
  'what-i-wish-i-had-known-before-working-while-traveling',
  'the-place-i-keep-thinking-about-and-why',
  'how-traveling-changed-what-i-want-from-everyday-life'
]

test('travel separates home, residence, countries, and repeat visits', async ({ page }) => {
  await page.goto('/travel/')
  await expect(page.locator('h1')).toHaveText('A life in more than one place.')
  await expect(page.locator('dt').filter({ hasText: 'Countries visited abroad' }).locator('+ dd')).toHaveText('14')
  await expect(page.locator('dt').filter({ hasText: 'Country visits' }).locator('+ dd')).toHaveText('29')
  await expect(page.locator('#travel-countries article')).toHaveCount(15)
  await expect(page.locator('#country-co')).toContainText('Home country')
  await expect(page.locator('#country-py')).toContainText('7 visits · Country of residence')
  await expect(page.locator('#country-mx')).toContainText('there are more to add')
  await expect(page.locator('#country-ar')).toContainText('Patagonia is a region')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://santi020k.com/travel/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/pages\/travel\.webp$/u)
})

test('Lumen country selection updates travel details and clears them for unlisted places', async ({ page }) => {
  await page.goto('/travel/')
  const chooser = page.locator('[data-travel-explorer] select')
  const details = page.locator('[data-travel-selection]')

  await chooser.selectOption('PY')
  await expect(details).toContainText('Asunción · Encarnación · Ciudad del Este')
  await expect(details).toContainText('7 visits · Country of residence')
  await expect(details.locator('a')).toHaveAttribute('href', '#country-py')
  await chooser.selectOption('JP')
  await expect(details).toContainText('Tokyo · Osaka')
  await expect(details).toContainText('1 visit')
  await chooser.selectOption('CA')
  await expect(details).toContainText('No entry in my travel journal')
  await expect(details.locator('a')).toBeHidden()
  await expect(details).not.toContainText('Tokyo')
  await chooser.selectOption('CO')
  await expect(details).toContainText('Home country')
  await expect(details.locator('a')).toBeVisible()
})

test('map supports pointer selection, keyboard zoom, and return navigation', async ({ page }) => {
  await page.goto('/travel/')
  await page.locator('[data-ui-world-map-country="BR"]').click()
  await expect(page.locator('[data-travel-selection]')).toContainText('Rio de Janeiro · São Paulo · Iguazu')
  const zoomIn = page.locator('button[aria-label="Zoom in"]')
  await zoomIn.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-ui-world-map-zoom-status]')).toHaveText('150%')
  await expect(zoomIn).toBeFocused()
  await page.locator('a').filter({ hasText: 'Read the blog' }).click()
  await page.locator('a[href="/travel/"]').first().click()
  await page.locator('[data-travel-explorer] select').selectOption('MX')
  await expect(page.locator('[data-travel-selection]')).toContainText('7 visits')
})

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1440]) {
    test(`travel is accessible and fits ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/travel/')
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)
      await expect(page.locator('[data-travel-explorer] select')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }
}

test('country details remain readable without JavaScript on a phone', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/travel/')
  await expect(page.locator('#travel-countries article')).toHaveCount(15)
  await expect(page.locator('#country-jp')).toContainText('Tokyo')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await context.close()
})

test('title-only drafts stay out of production routes, feeds, search, and sitemaps', async ({ request }) => {
  for (const path of ['/blog/', '/search-index.json', '/feed.xml', '/feed.json', '/sitemap-0.xml', '/travel/']) {
    const response = await request.get(path)
    expect(response.ok()).toBe(true)
    const body = await response.text()
    for (const slug of draftSlugs) expect(body).not.toContain(slug)
  }
  for (const slug of draftSlugs) {
    const response = await request.get(`/blog/${slug}/`)
    expect(response.status()).toBe(404)
  }
})
