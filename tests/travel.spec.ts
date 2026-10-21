import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

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
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/pages\/travel\.webp\?v=[a-f0-9]{12}$/u)
})

test('Lumen country selection updates travel details and clears them for unlisted places', async ({ page }) => {
  await page.goto('/travel/')
  const chooser = page.locator('[data-travel-explorer] select')
  const details = page.locator('[data-travel-selection]')

  await chooser.focus()
  await chooser.selectOption('PY')
  await expect(details.locator('[data-travel-places] li')).toHaveText(['Asunción', 'Encarnación', 'Ciudad del Este'])
  await expect(details).toContainText('7 visits · Country of residence')
  await chooser.selectOption('JP')
  await expect(details.locator('[data-travel-places] li')).toHaveText(['Tokyo', 'Osaka'])
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
  await expect(page.locator('[data-ui-world-map-select]')).toBeEnabled()
  await expect(page.locator('[data-travel-explorer]')).toHaveAttribute('data-bound', 'true')
  await page.locator('[data-ui-world-map-country="BR"]').click()
  await expect(page.locator('[data-travel-places] li')).toHaveText(['Rio de Janeiro', 'São Paulo', 'Iguazu'])
  const zoomIn = page.locator('button[aria-label="Zoom in"]')
  await zoomIn.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-ui-world-map-zoom-status]')).toHaveText('150%')
  await expect(zoomIn).toBeFocused()
  await page.locator('a').filter({ hasText: 'Read the blog' }).click()
  await expect(page).toHaveURL(/\/blog\/$/u)
  await page.getByRole('link', { name: 'Travel', exact: true }).last().click()
  await expect(page).toHaveURL(/\/travel\/$/u)
  await expect(page.locator('[data-travel-explorer]')).toHaveAttribute('data-bound', 'true')
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
      await page.locator('[data-ui-world-map-select]').selectOption('PY')
      await page.locator('[data-travel-next]').hover()
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
  await expect(page.locator('[data-ui-world-map-select]')).toBeEnabled()
  await expect(page.locator('[data-travel-explorer]')).toHaveAttribute('data-bound', 'true')
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
    const viewport = requireValue(await page.locator('[data-ui-world-map-viewport]').boundingBox())
    const controls = requireValue(await page.locator('.ui-world-map__zoom-controls').boundingBox())
    const hero = requireValue(await page.locator('[data-travel-explorer]').boundingBox())
    const introduction = requireValue(await page.locator('[data-travel-intro]').boundingBox())
    expect(viewport.y + viewport.height).toBeLessThanOrEqual(introduction.y)
    expect(hero.x).toBeCloseTo(0, 0)
    expect(hero.width).toBeCloseTo(width, 0)
    expect(viewport.width).toBeCloseTo(width, 0)
    await expect(page.locator('[data-particles-bg]')).toBeHidden()
    await expect(page.locator('header a[href="/travel/"][aria-current="page"]').first()).toHaveCount(1)
    expect(controls.x).toBeGreaterThanOrEqual(viewport.x)
    expect(controls.y).toBeGreaterThanOrEqual(viewport.y)
    expect(controls.x + controls.width).toBeLessThanOrEqual(viewport.x + viewport.width)
    expect(controls.y + controls.height).toBeLessThanOrEqual(viewport.y + viewport.height)
    await expect(page.locator('[data-ui-world-map-select]')).toBeEnabled()
    await expect(page.locator('[data-travel-explorer]')).toHaveAttribute('data-bound', 'true')
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
  await expect(page.locator('[data-travel-places] li')).toHaveText(['Tokyo', 'Osaka'])
  await expect.poll(() => page.locator('[data-ui-world-map-viewport]').evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await chooser.selectOption('')
  await expect(page.locator('[data-travel-selection]')).toBeHidden()
})

for (const width of [375, 1440]) {
  test(`editorial sections align with the hero and the notebook works by keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/travel/')
    const introduction = requireValue(await page.locator('[data-travel-intro]').boundingBox())
    for (const section of await page.locator('[data-travel-section]').all()) {
      const bounds = requireValue(await section.boundingBox())
      expect(bounds.x).toBeCloseTo(introduction.x, 0)
      expect(bounds.width).toBeCloseTo(introduction.width, 0)
    }
    const summary = page.locator('#travel-notebook summary')
    await expect(page.locator('#country-jp')).toBeHidden()
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#country-jp')).toBeVisible()
    await expect(summary).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expectNoUnexpectedAccessibilityViolations(page)
    await page.keyboard.press('Space')
    await expect(page.locator('#country-jp')).toBeHidden()
  })
}

for (const width of [375, 390]) {
  test(`phone map fills its height and keeps country details below the geography at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/travel/')
    await expect(page.locator('[data-ui-world-map-select]')).toBeEnabled()
    await expect(page.locator('[data-travel-explorer]')).toHaveAttribute('data-bound', 'true')
    const viewport = page.locator('[data-ui-world-map-viewport]')
    const map = requireValue(await viewport.boundingBox())
    const plot = requireValue(await page.locator('.ui-world-map__plot').boundingBox())
    expect(map.height).toBeGreaterThanOrEqual(512)
    expect(plot.height).toBeGreaterThanOrEqual(map.height - 1)
    await expect(page.locator('[data-ui-world-map-country="CO"]')).toBeInViewport({ ratio: 1 })
    await page.locator('[data-ui-world-map-country="BR"]').click()
    const details = page.locator('[data-travel-selection]')
    await expect(details).toBeVisible()
    await expect(details.locator('li')).toHaveText(['Rio de Janeiro', 'São Paulo', 'Iguazu'])
    const placement = await details.evaluate(element => ({
      top: element.getBoundingClientRect().top,
      mapBottom: document.querySelector('[data-ui-world-map-viewport]')?.getBoundingClientRect().bottom
    }))
    expect(placement.top).toBeGreaterThanOrEqual(requireValue(placement.mapBottom))
    await expect(page.getByRole('button', { name: 'Close country details' })).toBeInViewport({ ratio: 1 })
    await page.getByRole('button', { name: 'Close country details' }).click()
    await expect(details).toBeHidden()
    await expect(viewport).toBeFocused()
  })
}

test('country notebook preserves partial lists, home copy, and matching silhouettes when switching destinations', async ({ page }) => {
  await page.goto('/travel/')
  const chooser = page.locator('[data-ui-world-map-select]')
  const details = page.locator('[data-travel-selection]')
  await expect(chooser).toBeEnabled()
  await chooser.focus()
  await chooser.selectOption('MX')
  await expect(details.locator('li')).toHaveText(['Mexico City (DF)', 'Cancún', 'Puebla', 'Querétaro'])
  await expect(details.locator('[data-travel-note]')).toContainText('there are more to add')
  await expect(details.locator('[data-travel-silhouette] path')).toHaveAttribute('d', requireValue(await page.locator('[data-ui-world-map-country="MX"]').getAttribute('d')))
  await chooser.selectOption('AR')
  await expect(details.locator('[data-travel-note]')).toContainText('Patagonia is a region')
  await chooser.selectOption('CO')
  await expect(details.locator('li')).toHaveCount(0)
  await expect(details.locator('[data-travel-places-heading]')).toBeHidden()
  await expect(details.locator('[data-travel-note]')).toBeHidden()
  await expect(details.locator('[data-travel-empty]')).toContainText('I’m from Colombia')
  await expect(details.locator('[data-travel-visits]')).toHaveText('Home country')
  await chooser.selectOption('CA')
  await expect(details.locator('[data-travel-empty]')).toContainText('Choose a highlighted country')
  await expect(details.locator('[data-travel-silhouette] path')).toHaveAttribute('d', requireValue(await page.locator('[data-ui-world-map-country="CA"]').getAttribute('d')))
  await expect(chooser).toBeFocused()
})

for (const width of [390, 1440]) {
  test(`travel country picker stays visible and prioritizes notebook destinations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/travel/')
    const chooser = page.getByRole('combobox', { name: 'Explore a country', exact: true })
    await expect(chooser).toBeEnabled()
    await expect(chooser).toBeVisible()
    const picker = requireValue(await chooser.boundingBox())
    const map = requireValue(await page.locator('[data-ui-world-map-viewport]').boundingBox())
    expect(picker.y).toBeGreaterThanOrEqual(map.y + map.height)
    expect(picker.height).toBeGreaterThanOrEqual(44)
    expect(picker.x).toBeGreaterThanOrEqual(0)
    expect(picker.x + picker.width).toBeLessThanOrEqual(width)
    await expect(chooser.locator('optgroup[label="My notebook"] option')).toHaveCount(15)
    await expect(chooser.locator('optgroup[label="My notebook"] option').first()).toHaveText('Colombia')
    await chooser.selectOption('PY')
    await expect(page.locator('[data-travel-country]')).toHaveText('Paraguay')
    await expect(page.locator('[data-travel-next-country]')).toHaveText('Uruguay')
  })
}

test('travel notebook navigation names destinations, wraps in both directions, and retains focus', async ({ page }) => {
  await page.goto('/travel/')
  const chooser = page.locator('[data-ui-world-map-select]')
  const heading = page.locator('[data-travel-country]')
  const previous = page.locator('[data-travel-previous]')
  const next = page.locator('[data-travel-next]')
  await chooser.selectOption('CO')
  await expect(previous).toHaveAccessibleName('Previous country: Japan')
  await previous.focus()
  await page.keyboard.press('Enter')
  await expect(heading).toHaveText('Japan')
  await expect(previous).toBeFocused()
  await expect(next).toHaveAccessibleName('Next country Colombia')
  await next.click()
  await expect(heading).toHaveText('Colombia')
  await expect(chooser).toHaveValue('CO')
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(heading).toHaveText('United States')
  await expect(next).toBeFocused()
  await chooser.selectOption('CA')
  await expect(previous).toHaveAccessibleName('Previous country: Japan')
  await expect(next).toHaveAccessibleName('Next country Colombia')
})

test('closing travel details on a phone returns to the map without losing zoom or horizontal position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/travel/')
  const viewport = page.locator('[data-ui-world-map-viewport]')
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await page.locator('[data-ui-world-map-select]').selectOption('JP')
  await expect(page.locator('[data-travel-country]')).toHaveText('Japan')
  const scrollLeft = await viewport.evaluate(element => element.scrollLeft)
  await page.locator('[data-travel-close]').click()
  await expect(page.locator('[data-travel-selection]')).toBeHidden()
  await expect(viewport).toBeFocused()
  await expect(viewport).toBeInViewport({ ratio: 0.8 })
  await expect(page.locator('[data-ui-world-map-zoom-status]')).toHaveText('150%')
  expect(await viewport.evaluate(element => element.scrollLeft)).toBeCloseTo(scrollLeft, 0)
})

test('a pointer choice in the travel picker reveals the phone card without moving keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/travel/')
  const chooser = page.locator('[data-ui-world-map-select]')
  await chooser.focus()
  await chooser.dispatchEvent('pointerdown', { pointerType: 'touch' })
  await chooser.selectOption('PY')
  await expect(page.locator('[data-travel-selection]')).toBeInViewport({ ratio: 1 })
  await expect(chooser).toBeFocused()
})

test('travel desktop cards leave the selected country visible on either side of the map', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/travel/')
  const chooser = page.locator('[data-ui-world-map-select]')
  const details = page.locator('[data-travel-selection]')
  for (const code of ['PY', 'JP']) {
    await chooser.selectOption(code)
    const card = requireValue(await details.boundingBox())
    const country = requireValue(await page.locator(`[data-ui-world-map-country="${code}"]`).boundingBox())
    expect(card.x + card.width <= country.x || card.x >= country.x + country.width).toBe(true)
  }
})
