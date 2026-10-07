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
  await expect(page.locator('h1')).toHaveText(/A life in\s*more than one place\./u)
  await expect(page.locator('[aria-label="14 countries visited abroad and 29 country visits"]')).toBeVisible()
  await expect(page.locator('[data-ui-world-map]')).toHaveAttribute('data-variant', 'dotted')
  await expect(page.locator('[data-travel-selection]')).toBeHidden()
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

  await chooser.focus()
  await chooser.selectOption('PY')
  await expect(details).toContainText('Asunción · Encarnación · Ciudad del Este')
  await expect(details).toContainText('7 visits · Country of residence')
  await chooser.selectOption('JP')
  await expect(details).toContainText('Tokyo · Osaka')
  await expect(details).toContainText('1 visit')
  await chooser.selectOption('CA')
  await expect(details).toContainText('No entry in my travel journal')
  await expect(details.locator('h2')).toHaveText('Canada')
  await expect(details).not.toContainText('Tokyo')
  await chooser.selectOption('CO')
  await expect(details).toContainText('Home country')
  await expect(details).toBeVisible()
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
  await page.locator('[data-travel-explorer] select').focus()
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
      await expect(page.locator('[data-ui-world-map-viewport]')).toBeVisible()
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
  await page.locator('#travel-notebook summary').click()
  await expect(page.locator('#country-jp')).toBeVisible()
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

test('country details close, reopen the same country, and cycle through places', async ({ page }) => {
  await page.goto('/travel/')
  const details = page.locator('[data-travel-selection]')
  await page.locator('[data-ui-world-map-country="BR"]').click()
  await expect(details).toBeVisible()
  await page.locator('[data-travel-next]').click()
  await expect(details).toContainText('Chile')
  await expect(details).toContainText('Santiago de Chile')
  await page.locator('[data-travel-close]').click()
  await expect(details).toBeHidden()
  await expect(page.locator('[data-ui-world-map-viewport]')).toBeFocused()
  await page.locator('[data-ui-world-map-country="BR"]').click()
  await expect(details).toContainText('Brazil')
  await page.locator('[data-travel-next]').focus()
  await page.keyboard.press('Escape')
  await expect(details).toBeHidden()
  await expect(page.locator('[data-ui-world-map-viewport]')).toBeFocused()
})

for (const width of [320, 390, 768, 1440, 1920]) {
  test(`map controls stay inside the map at ${width}px and selected details remain accessible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/travel/')
    const viewport = await page.locator('[data-ui-world-map-viewport]').boundingBox()
    const controls = await page.locator('.ui-world-map__zoom-controls').boundingBox()
    const hero = await page.locator('[data-travel-explorer]').boundingBox()
    if (!viewport || !controls || !hero) throw new Error('Map controls, viewport, and hero must be rendered')
    expect(hero.x).toBeCloseTo(0, 0)
    expect(hero.width).toBeCloseTo(width, 0)
    expect(viewport.width).toBeCloseTo(width, 0)
    await expect(page.locator('[data-particles-bg]')).toBeHidden()
    await expect(page.locator('header a[href="/travel/"][aria-current="page"]').first()).toHaveCount(1)
    expect(controls.x).toBeGreaterThanOrEqual(viewport.x)
    expect(controls.y).toBeGreaterThanOrEqual(viewport.y)
    expect(controls.x + controls.width).toBeLessThanOrEqual(viewport.x + viewport.width)
    expect(controls.y + controls.height).toBeLessThanOrEqual(viewport.y + viewport.height)
    await page.locator('[data-ui-world-map-country="BR"]').click()
    await expect(page.locator('[data-travel-selection]')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('keyboard exploration reveals off-screen countries on mobile and clears empty selections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/travel/')
  const chooser = page.locator('[data-travel-explorer] select')
  await chooser.focus()
  await chooser.selectOption('JP')
  await expect(page.locator('[data-travel-selection]')).toContainText('Tokyo · Osaka')
  await expect.poll(() => page.locator('[data-ui-world-map-viewport]').evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await chooser.selectOption('')
  await expect(page.locator('[data-travel-selection]')).toBeHidden()
})
