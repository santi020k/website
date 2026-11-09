import { expect, type Page, test } from '@playwright/test'
import { z } from 'astro/zod'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const indexSchema = z.array(z.object({ path: z.string(), title: z.string(), type: z.string() }))

const switchToSpanish = async (page: Page) => {
  const headerSwitch = page.locator('[data-language-switch="header"]')

  if (await headerSwitch.isVisible()) {
    await headerSwitch.click()
  } else {
    await page.locator('[data-mobile-nav-toggle]').click()
    await page.locator('[data-language-switch="menu"]').click()
  }
}

test('every published translation has a local canonical and is included in the sitemap', async ({ request }) => {
  const englishPayload: unknown = await (await request.get('/search-index.json')).json()
  const spanishPayload: unknown = await (await request.get('/es/search-index.json')).json()
  const english = indexSchema.parse(englishPayload).filter(entry => entry.type !== 'page')
  const spanish = indexSchema.parse(spanishPayload).filter(entry => entry.type !== 'page')
  const sitemap = await (await request.get('/sitemap.xml')).text()

  expect(spanish.map(entry => entry.path)).toEqual(english.map(entry => `/es${entry.path}`))
  expect(spanish.length).toBeGreaterThan(60)
  for (const entry of spanish) {
    const response = await request.get(entry.path)
    const html = await response.text()

    expect(response.status(), entry.path).toBe(200)
    expect(html, entry.path).toContain(`rel="canonical" href="https://santi020k.com${entry.path}"`)
    expect(html, entry.path).toContain('name="robots" content="index, follow')
    expect(html, entry.path).toMatch(/(?:lang="es"[^>]*data-pagefind-body|data-pagefind-body[^>]*lang="es")/u)
    expect(sitemap, entry.path).toContain(`<loc>https://santi020k.com${entry.path}</loc>`)
  }
})

for (const route of ['/blog/playwright-accessibility-checks-that-teams-keep-running/', '/portfolio/lumen-ui/']) {
  test(`translated ${route} preserves section fragments and accessible references`, async ({ page }) => {
    await page.goto(route)
    const headings = await page.locator('[data-pagefind-body] :is(h2,h3)[id]').evaluateAll(elements => elements.map(element => ({ id: element.id, text: element.textContent })))

    await page.goto(`/es${route}`)
    const translated = await page.locator('[data-pagefind-body] :is(h2,h3)[id]').evaluateAll(elements => elements.map(element => ({ id: element.id, text: element.textContent })))

    expect(translated.map(heading => heading.id)).toEqual(headings.map(heading => heading.id))
    expect(translated.map(heading => heading.text)).not.toEqual(headings.map(heading => heading.text))
    const missingLabels = await page.locator('main [aria-labelledby]').evaluateAll(elements => elements.flatMap(element => (element.getAttribute('aria-labelledby') ?? '').split(/\s+/u).filter(id => id && !document.getElementById(id))))

    expect(missingLabels).toEqual([])
    await expect(page.locator('[data-article-language]')).toHaveCount(0)
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('Spanish title search reloads after switching from English', async ({ page }) => {
  await page.goto('/blog/')
  await page.locator('[data-site-search-trigger]').click()
  await page.locator('#site-search-input').fill('Playwright')
  await expect(page.locator('[data-site-search-result]').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await switchToSpanish(page)
  await expect(page).toHaveURL(/\/es\/blog\/$/u)
  await page.locator('[data-site-search-trigger]').click()
  await page.locator('#site-search-input').fill('Playwright')
  await expect(page.locator('[data-site-search-result-title]').first()).toHaveAttribute('lang', 'es')
  await expect(page.locator('[data-site-search-result]').first()).toHaveAttribute('href', /^\/es\//u)
})

test('translated case studies localize roles and embedded navigation labels', async ({ page }) => {
  await page.goto('/es/portfolio/lumen-ui/')
  await expect(page.locator('[data-project-meta="role"] dd')).toHaveText('Creador')
  await expect(page.locator('[data-consumer-examples]')).toHaveAccessibleName('Ver Lumen en uso')
})

test('Spanish editorial references and checklists retain their rendered presentation', async ({ page }) => {
  await page.goto('/es/blog/migrate-eslint-8-or-less-to-eslint-9/')
  await expect(page.getByRole('navigation', { name: 'Referencias de este artículo' })).toHaveCount(1)
  await expect(page.locator('[data-article-references]')).toContainText('Con esta guía')
  await expect(page.locator('[data-figure-label]').first()).toContainText('Figura')
  await page.goto('/es/blog/playwright-accessibility-checks-that-teams-keep-running/')
  await expect(page.locator('[data-checklist-ledger]')).toHaveCount(1)
  await expect(page.locator('[data-code-example][aria-label^="Code example"]')).toHaveCount(0)
})

test('published body search changes language after client navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/blog/?q=changesets')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('[data-site-search-full-text]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await switchToSpanish(page)
  await expect(page).toHaveURL(/\/es\/blog\//u)
  await page.locator('[data-site-search-trigger]').click()
  await page.locator('#site-search-input').fill('violaciones')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('[data-site-search-full-text]')).toHaveText('Mencionado en')
  const paths = await page.locator('[data-site-search-result]').evaluateAll(links => links.map(link => link.getAttribute('href')))

  expect(paths.length).toBeGreaterThan(0)
  expect(paths.every(path => path?.startsWith('/es/'))).toBe(true)
  await expect(page.locator('[data-site-search-result-description]').first()).toHaveAttribute('lang', 'es')
})
