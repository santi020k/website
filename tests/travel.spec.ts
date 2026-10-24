import { expect, test } from '@playwright/test'

import { getTravelVisitLabel, travelCountries } from '../src/data/travel'

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
  await expect(page.locator('[data-travel-counts] dt')).toHaveText(['countries abroad', 'visits'])
  await expect(page.locator('[data-travel-counts] dd')).toHaveText(['14', '29'])
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
  await expect(details.locator('[data-travel-place-name]')).toHaveText(['Asunción', 'Encarnación', 'Ciudad del Este'])
  await expect(details).toContainText('7 visits · Country of residence')
  await chooser.selectOption('JP')
  await expect(details.locator('[data-travel-place-name]')).toHaveText(['Tokyo', 'Osaka'])
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
  await expect(page.locator('[data-travel-place-name]')).toHaveText(['Rio de Janeiro', 'São Paulo', 'Iguazu'])
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

for (const theme of ['light', 'dark'] as const) {
  test(`travel totals keep labels and values readable without JavaScript at 200% text in ${theme}`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme: theme,
      viewport: { width: 320, height: 844 }
    })
    const page = await context.newPage()
    await page.goto('/travel/')
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%'
      await document.fonts.ready
    })
    const totals = page.locator('[data-travel-counts]')
    await expect(totals.locator('dt')).toHaveText(['countries abroad', 'visits'])
    await expect(totals.locator('dd')).toHaveText(['14', '29'])
    const readable = await totals.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        for (const match of (node.textContent ?? '').matchAll(/[^\s]+/gu)) {
          const range = document.createRange()
          range.setStart(node, match.index)
          range.setEnd(node, match.index + match[0].length)
          const rects = [...range.getClientRects()]
          const fits = rects.every(rect => rect.left >= bounds.left && rect.right <= bounds.right)
          if (rects.length !== 1 || !fits) return false
        }
      }
      return true
    })
    expect(readable).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await context.close()
  })

  test(`roots and returns story preserves complete words without JavaScript at 200% text in ${theme}`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme: theme,
      reducedMotion: 'reduce',
      viewport: { width: 320, height: 844 }
    })
    const page = await context.newPage()
    await page.goto('/travel/')
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%'
      await document.fonts.ready
    })
    const story = page.getByRole('region', { name: 'Colombia, Paraguay, and the places between.' })
    await expect(story).toContainText('Colombia is where I’m from.')
    await expect(story).toContainText('Asunción, Encarnación, and Ciudad del Este.')
    await expect(story).toContainText('the memories I want to keep.')
    const splitWords = await story.evaluate(element => {
      const problems: string[] = []
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        for (const match of (node.textContent ?? '').matchAll(/[^\s]+/gu)) {
          const range = document.createRange()
          range.setStart(node, match.index)
          range.setEnd(node, match.index + match[0].length)
          if (range.getClientRects().length > 1) problems.push(match[0])
        }
      }
      return problems
    })
    expect(splitWords).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await context.close()
  })

  test(`travel stories invitation stays readable and opens the blog without JavaScript in ${theme}`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme: theme,
      reducedMotion: 'reduce',
      viewport: { width: 320, height: 844 }
    })
    const page = await context.newPage()
    await page.goto('/travel/')
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%'
      await document.fonts.ready
    })
    const invitation = page.getByRole('region', { name: 'More than places on a map.' })
    await expect(invitation).toContainText('Travel posts will join my blog as I finish writing them.')
    const blogLink = invitation.getByRole('link', { name: 'Read the blog' })
    await blogLink.focus()
    await expect(blogLink).toBeFocused()
    await expect(blogLink).toBeInViewport({ ratio: 1 })
    const layout = await invitation.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const text = [...element.querySelectorAll('p,h2,a')]
      return {
        fits: text.every(node => {
          const range = document.createRange()
          range.selectNodeContents(node)
          return [...range.getClientRects()].every(rect => rect.left >= bounds.left && rect.right <= bounds.right)
        }),
        overflows: document.documentElement.scrollWidth > window.innerWidth
      }
    })
    expect(layout).toEqual({ fits: true, overflows: false })
    const focusStyle = await blogLink.evaluate(element => getComputedStyle(element).outlineStyle)
    expect(focusStyle).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/$/u)
    await context.close()
  })

  test(`country notebook stays readable without JavaScript at 200% text in ${theme}`, async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme: theme,
      viewport: { width: 320, height: 844 }
    })
    const page = await context.newPage()
    await page.goto('/travel/')
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%'
      await document.fonts.ready
    })
    const summary = page.locator('#travel-notebook summary')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(summary).toBeFocused()
    for (const country of travelCountries) {
      const entry = page.locator(`#country-${country.code.toLowerCase()}`)
      await expect(entry.getByRole('heading', { level: 3 })).toHaveText(country.name)
      await expect(entry).toContainText(getTravelVisitLabel(country))
      await expect(entry.getByRole('listitem')).toHaveText([...country.places])
      await expect(entry.locator('[data-travel-country-note]')).toHaveText(
        [country.note].filter((note): note is string => typeof note === 'string')
      )
    }
    await expect(page.locator('#country-co')).toContainText('I’m from Colombia. This is where my story begins.')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const splitWords = await page.locator('[data-travel-country-list]').evaluate(element => {
      const problems: string[] = []
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (node.parentElement?.closest('[aria-hidden="true"]')) continue
        for (const match of (node.textContent ?? '').matchAll(/[^\s]+/gu)) {
          const range = document.createRange()
          range.setStart(node, match.index)
          range.setEnd(node, match.index + match[0].length)
          if (range.getClientRects().length > 1) problems.push(match[0])
        }
      }
      return problems
    })
    expect(splitWords).toEqual([])
    await page.keyboard.press('Space')
    await expect(page.locator('#country-jp')).toBeHidden()
    await context.close()
  })
}

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
  await expect(page.locator('[data-travel-place-name]')).toHaveText(['Tokyo', 'Osaka'])
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
    await expect(details.locator('[data-travel-place-name]')).toHaveText(['Rio de Janeiro', 'São Paulo', 'Iguazu'])
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
  await expect(details.locator('[data-travel-place-name]')).toHaveText(['Mexico City (DF)', 'Cancún', 'Puebla', 'Querétaro'])
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

test('passport folio preserves all notebook counts and places when changing countries', async ({ page }) => {
  await page.goto('/travel/')
  const chooser = page.getByRole('combobox', { name: 'Explore a country', exact: true })
  const details = page.locator('[data-travel-selection]')
  for (const country of travelCountries) {
    await chooser.selectOption(country.code)
    await expect(details.locator('h2')).toHaveText(country.name)
    await expect(details.locator('[data-travel-visits]')).toHaveText(getTravelVisitLabel(country))
    await expect(details.locator('[data-travel-visit-total]')).toHaveText(country.visits?.toString() ?? '')
    await expect(details.locator('[data-travel-visit-total]')).toBeVisible({ visible: country.visits !== null })
    await expect(details.locator('[data-travel-place-name]')).toHaveText([...country.places])
    await expect(details.locator('[data-travel-place-number][aria-hidden="true"]')).toHaveText(country.places.map((_, index) => String(index + 1).padStart(2, '0')))
  }
  await chooser.selectOption('CA')
  await expect(details.locator('[data-travel-visit-total]')).toBeHidden()
  await expect(details.locator('[data-travel-visit-total]')).toBeEmpty()
  await expect(details.locator('[data-travel-visits]')).toHaveText('No entry in my travel journal')
  await expect(details.locator('li')).toHaveCount(0)
})

for (const theme of ['light', 'dark']) {
  test(`passport folio reflows at 200% text and remains usable by keyboard in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/travel/')
    const regularHeadingSize = await page.locator('[data-travel-country]').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))
    await page.evaluate(value => {
      document.documentElement.dataset.theme = value
      document.documentElement.style.fontSize = '200%'
    }, theme)
    const chooser = page.getByRole('combobox', { name: 'Explore a country', exact: true })
    const details = page.locator('[data-travel-selection]')
    for (const code of ['GT', 'MX', 'PY', 'CO', 'CA']) {
      await chooser.selectOption(code)
      expect(await details.locator('h2').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(regularHeadingSize)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      expect(await details.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      const splitWords = await details.evaluate(element => {
        const problems: string[] = []
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
          const node = walker.currentNode
          const parent = node.parentElement
          if (!parent || parent.closest('[aria-hidden="true"], .sr-only') || !parent.checkVisibility()) continue
          for (const match of (node.textContent ?? '').matchAll(/[^\s]+/gu)) {
            const range = document.createRange()
            range.setStart(node, match.index)
            range.setEnd(node, match.index + match[0].length)
            if (range.getClientRects().length > 1) problems.push(match[0])
          }
        }
        return problems
      })
      expect(splitWords).toEqual([])
    }
    const next = page.locator('[data-travel-next]')
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(details.locator('h2')).toHaveText('Colombia')
    await expect(next).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(details).toBeHidden()
    await expect(page.locator('[data-ui-world-map-viewport]')).toBeFocused()
  })
}
