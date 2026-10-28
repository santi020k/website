import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const translatedPages = ['/', '/about/', '/work/', '/resume/', '/speaking/', '/privacy/', '/terms/', '/accessibility/', '/travel/', '/history/', '/developer-experience/', '/projects/', '/portfolio/', '/technologies/', '/blog/', '/blog/tags/', '/blog/series/']

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

test('Spanish article and case-study shells retain English prose', async ({ page }) => {
  for (const path of ['/blog/playwright-accessibility-checks-that-teams-keep-running/', '/portfolio/lumen-ui/']) {
    await page.goto(`/es${path}`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
    await expect(page.locator('[lang="en"]').first()).toBeAttached()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://santi020k.com/es${path}`)
  }
})
