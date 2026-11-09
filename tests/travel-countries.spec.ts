import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'
import { load } from 'js-yaml'

import { travelCountries } from '../src/data/travel'
import { travelNotesSchema } from '../src/data/travel-notes-schema'
import { getLocalizedTravelCountries, getLocalizedVisitLabel } from '../src/i18n/travel'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'
import { waitForFonts } from './helpers/rendering'

const countrySlugs: Readonly<Record<string, string>> = {
  CO: 'colombia',
  US: 'united-states',
  MX: 'mexico',
  GT: 'guatemala',
  PA: 'panama',
  EC: 'ecuador',
  PE: 'peru',
  BR: 'brazil',
  CL: 'chile',
  PY: 'paraguay',
  UY: 'uruguay',
  AR: 'argentina',
  ES: 'spain',
  FR: 'france',
  JP: 'japan'
}

const readNotes = (slug: string) => {
  const raw = readFileSync(new URL(`../src/content/country/${slug}.md`, import.meta.url), 'utf8')
  const frontmatter = requireValue(/^---\r?\n([\s\S]*?)\r?\n---/u.exec(raw))

  return travelNotesSchema.parse(load(requireValue(frontmatter[1])))
}

const formatScore = (score: number | null, locale: string, notRated: string) => score === null ?
  notRated :
  `${new Intl.NumberFormat(locale).format(score)} / 10`

const locales = [
  { locale: 'en', prefix: '', japan: 'Japan', notRated: 'Not rated yet', allCountries: 'All countries' },
  { locale: 'es', prefix: '/es', japan: 'Japón', notRated: 'Sin calificar', allCountries: 'Todos los países' }
] as const

for (const { locale, prefix, japan, notRated, allCountries } of locales) {
  test(`every country has a real ${locale} route and unknown countries stay missing`, async ({ request }) => {
    for (const slug of Object.values(countrySlugs)) {
      const response = await request.get(`${prefix}/travel/${slug}/`)
      expect(response.status(), slug).toBe(200)
      expect(await response.text(), slug).toContain('data-country-notebook')
    }
    expect((await request.get(`${prefix}/travel/not-a-country/`)).status()).toBe(404)
  })

  test(`the ${locale} notebook links each country to its own page`, async ({ page }) => {
    await page.goto(`${prefix}/travel/`)
    await page.locator('#travel-notebook summary').click()
    const links = page.locator('#travel-notebook h3 a')
    await expect(links).toHaveCount(travelCountries.length)

    for (const country of getLocalizedTravelCountries(locale)) {
      const entry = page.locator(`#country-${country.code.toLowerCase()}`)
      const slug = requireValue(countrySlugs[country.code])
      const notes = readNotes(slug)
      const score = formatScore(notes.score, locale, notRated)
      await expect(entry.getByRole('link', { name: country.name, exact: true })).toHaveAttribute('href', `${prefix}/travel/${slug}/`)
      await expect(entry.locator('[data-travel-experience]')).toContainText(score)
    }

    const japanLink = links.filter({ hasText: japan })
    await japanLink.focus()
    await expect(japanLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${prefix}/travel/japan/$`, 'u'))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(japan)
    await page.getByRole('link', { name: allCountries, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${prefix}/travel/#travel-countries$`, 'u'))
  })

  test(`${locale} country pages preserve scores and honest indexing metadata`, async ({ page }) => {
    const notes = readNotes('japan')
    const score = formatScore(notes.score, locale, notRated)
    const noindex = !notes.summary || notes.language !== locale
    await page.goto(`${prefix}/travel/japan/`)
    await expect(page.locator('[data-country-score]')).toHaveText(score)
    await expect(page.locator('[data-country-score]')).toHaveAttribute('data-rated', String(notes.score !== null))
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://santi020k.com${prefix}/travel/japan/`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', noindex ? 'noindex, follow' : /^index, follow/u)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/pages\/travel\.webp(?:\?v=[a-f0-9]{12})?$/u)
    const sitemapResponse = await page.request.get('/sitemap-0.xml')
    expect(sitemapResponse.status()).toBe(200)
    const sitemap = await sitemapResponse.text()
    expect(sitemap.includes(`https://santi020k.com${prefix}/travel/japan/`)).toBe(!noindex)
  })

  test(`${locale} country facts and navigation work without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const country = requireValue(getLocalizedTravelCountries(locale).find(entry => entry.code === 'PY'))
    await page.goto(`${prefix}/travel/paraguay/`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(country.name)
    await expect(page.locator('[data-country-notebook]')).toContainText(getLocalizedVisitLabel(country, locale))
    for (const place of country.places) {
      await expect(page.locator('[data-country-places]')).toContainText(place)
    }
    await page.getByRole('link', { name: allCountries, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${prefix}/travel/#travel-countries$`, 'u'))
    await page.locator('#travel-notebook summary').click()
    await page.locator('#country-co h3 a').click()
    await expect(page).toHaveURL(new RegExp(`${prefix}/travel/colombia/$`, 'u'))
    await expect(page.locator('[data-country-notebook]')).toContainText(locale === 'en' ? 'Home country' : 'País de origen')
    await expect(page.locator('[data-country-notebook]')).not.toContainText(/\b0 (?:visits|visitas)\b/u)
    await context.close()
  })
}

test('country detail pages retain partial-place and regional context', async ({ page }) => {
  await page.goto('/travel/mexico/')
  await expect(page.locator('[data-country-places]')).toContainText('there are more to add')
  await page.goto('/travel/argentina/')
  await expect(page.locator('[data-country-places]')).toContainText('Patagonia is a region')
})

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1440]) {
    test(`country pages are accessible at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
      await page.goto('/travel/united-states/')
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)
      await waitForFonts(page)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('United States')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }

  test(`country details reflow at 200% text in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
    await page.goto('/es/travel/united-states/')
    await page.evaluate(value => {
      document.documentElement.dataset.theme = value
      document.documentElement.style.fontSize = '200%'
    }, theme)
    await waitForFonts(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Estados Unidos')
    await expect(page.locator('[data-country-score]')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
