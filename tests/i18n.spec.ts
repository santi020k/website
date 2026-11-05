import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const translatedPages = ['/', '/about/', '/work/', '/resume/', '/speaking/', '/privacy/', '/terms/', '/accessibility/', '/travel/', '/history/', '/developer-experience/', '/projects/', '/portfolio/', '/technologies/', '/blog/', '/blog/tags/', '/blog/series/', '/work-with-me/']

test.describe('English default language', () => {
  test.use({ locale: 'es-CO' })

  test('uses English for a Spanish browser and after visiting Spanish pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page).toHaveURL(/\/$/u)
    await expect(page.locator('[data-home-hero-heading]')).toContainText('I build products.')
    await page.goto('/es/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.locator('[data-language-switch="header"]')).toHaveAttribute('href', '/es/')
    await page.locator('[data-site-search-trigger]').click()
    await expect(page.locator('#site-search-title')).toHaveText('Search')
  })
})

for (const path of translatedPages) {
  test(`Spanish ${path} has a localized document and matching alternates`, async ({ page }) => {
    await page.goto(`/es${path}`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://santi020k.com/es${path}`)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://santi020k.com${path}`)
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', `https://santi020k.com/es${path}`)
  })
}

test('language switching and keyboard navigation retain the current page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/about/')
  await page.locator('[data-language-switch="header"]').click()
  await expect(page).toHaveURL(/\/es\/about\/$/u)
  await expect(page.getByRole('navigation', { name: 'Menú principal' }).first().getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/es/')
  await expect(page.locator('[data-language-switch="header"]')).toHaveAttribute('href', '/about/')
  await expect(page.locator('[data-site-footer] .maker-footer-action')).toHaveAttribute('href', '/es/work-with-me/#start')
  await expectNoUnexpectedAccessibilityViolations(page)
})

test('mobile menu exposes Spanish navigation and the English counterpart', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/es/')
  await page.locator('[data-mobile-nav-toggle]').click()
  await expect(page.locator('[data-language-switch="menu"]')).toBeVisible()
  await expect(page.locator('[data-mobile-nav-toggle-label]')).toHaveText('Cerrar')
  await page.locator('[data-language-switch="menu"]').click()
  await expect(page).toHaveURL(/\/$/u)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
})

test('search controls and recovery templates render in Spanish', async ({ page }) => {
  await page.goto('/es/')
  await page.locator('[data-site-search-trigger]').click()
  await expect(page.locator('#site-search-title')).toHaveText('Buscar')
  await expect(page.locator('#site-search-input')).toHaveAttribute('placeholder', 'Buscar en el sitio…')
  await expectNoUnexpectedAccessibilityViolations(page)
})

test('Spanish article and case-study shells retain English prose outside the search index', async ({ page }) => {
  const sitemap = await (await page.request.get('/sitemap-0.xml')).text()

  for (const path of ['/blog/playwright-accessibility-checks-that-teams-keep-running/', '/portfolio/lumen-ui/']) {
    await page.goto(path)
    // English-only content has no translation to announce.
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /\bindex, follow\b/u)
    const englishImage = await page.locator('meta[property="og:image"]').getAttribute('content')

    expect(sitemap).toContain(`<loc>https://santi020k.com${path}</loc>`)

    await page.goto(`/es${path}`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
    await expect(page.locator('[lang="en"]').first()).toBeAttached()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://santi020k.com/es${path}`)
    // The shell repeats the English main content, so only the original is indexed.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', englishImage ?? '')
    expect(sitemap).not.toContain(`<loc>https://santi020k.com/es${path}</loc>`)
  }
})

test('Spanish article discussions preserve the existing English thread identity', async ({ page }) => {
  await page.route('https://giscus.app/client.js', route => route.fulfill({ contentType: 'application/javascript', body: '' }))
  await page.goto('/es/blog/playwright-accessibility-checks-that-teams-keep-running/')
  await page.locator('[data-discussion-summary]').click()
  const script = page.locator('script[src="https://giscus.app/client.js"]')

  await expect(script).toHaveAttribute('data-lang', 'es')
  await expect(script).toHaveAttribute('data-mapping', 'specific')
  await expect(script).toHaveAttribute('data-term', 'blog/playwright-accessibility-checks-that-teams-keep-running/')
})

test('Spanish contact receipt keeps noindex with localized recovery navigation', async ({ page }) => {
  await page.goto('/es/work-with-me/sent/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u)
  await expect(page.locator('main a[href="/es/work-with-me/#start"]').first()).toBeVisible()
})

test('Spanish shells preserve external canonical destinations without conflicting alternates', async ({ page }) => {
  await page.goto('/es/blog/atomic-module-component-structure-for-react/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://medium.com/@santi020k/atomic-module-component-structure-for-react-34464b05832c')
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
  const response = await page.request.get('/sitemap.xml')
  const sitemap = await response.text()

  expect(sitemap).not.toContain('https://santi020k.com/es/blog/atomic-module-component-structure-for-react/')
})

test('language switching preserves the live query and fragment before the client router reads the link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/about/?campaign=example#career')
  await page.locator('[data-language-switch="header"]').click()
  await expect(page).toHaveURL(/\/es\/about\/\?campaign=example#career$/u)
  await page.locator('[data-language-switch="header"]').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/about\/\?campaign=example#career$/u)
})

test('Spanish resume evidence links keep their localized shell', async ({ page }) => {
  await page.goto('/es/resume/')
  const link = page.locator('[data-resume-evidence-note] a').first()

  await expect(link).toHaveAttribute('href', /^\/es\/portfolio\//u)
  await expect(link).toContainText('Lee el caso de estudio de')
})
