import { expect, test } from '@playwright/test'

import { createOfflinePreview } from './helpers/offline-preview'

const entries = [
  { title: 'Primary guide', path: '/about/', description: 'A primary match.', tags: [], type: 'post' },
  { title: 'Body guide', path: '/work/', description: 'Separate details.', tags: [], type: 'project' }
]

test('search switches languages without reloading and keeps body destinations in the selected locale', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
  await page.route('**/pagefind/pagefind.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'export async function debouncedSearch() { return { results: [{ data: async () => ({ url: "/work/", plain_excerpt: "A body mention." }) }] } }'
  }))
  await page.goto('/')
  const initialDocument = await page.evaluateHandle(() => document)

  await page.locator('[data-language-switch="header"]').click()
  await expect(page).toHaveURL(/\/es\/$/u)
  expect(await page.evaluate(original => original === document, initialDocument)).toBe(true)
  await page.locator('[data-site-search-trigger]').click()
  await page.locator('#site-search-input').fill('primary')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('[data-site-search-full-text]')).toHaveText('Mencionado en')
  await expect(page.locator('[data-site-search-result]').first()).toHaveAttribute('href', '/es/about/')
  await expect(page.locator('[data-site-search-result-type]').first()).toHaveText('Artículo')
  await expect(page.locator('[data-site-search-result-title]').first()).toHaveAttribute('lang', 'en')
  await expect(page.locator('#site-search-status')).toHaveText('2 resultados disponibles. Usa las flechas para navegar.')
  await page.locator('#site-search-input').press('ArrowDown')
  await page.locator('#site-search-input').press('Enter')
  await expect(page).toHaveURL(/\/es\/work\/$/u)
  await page.locator('[data-language-switch="header"]').click()
  await expect(page).toHaveURL(/\/work\/$/u)
  await page.locator('[data-site-search-trigger]').click()
  await page.locator('#site-search-input').fill('primary')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('#site-search-status')).toHaveText('2 results available. Use arrow keys to navigate.')
  await expect(page.locator('[data-site-search-result]').first()).toHaveAttribute('href', '/about/')
})

test('Spanish article link recovery keeps a selectable address and translated retry feedback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')) }
    })
  })
  await page.goto('/es/blog/astro-doctor-announcement/')
  await page.locator('#article-copy-link').click()
  await expect(page.locator('#article-copy-link')).toHaveAccessibleName('Intentar de nuevo')
  const recovery = page.locator('#article-copy-link-recovery')

  await expect(recovery).toBeVisible()
  await expect(recovery).toContainText('La copia automática no está disponible.')
  await expect(recovery.getByLabel('Selecciona y copia la dirección')).toHaveValue(
    'https://santi020k.com/es/blog/astro-doctor-announcement/'
  )
  await expect(page.locator('#article-copy-link-status')).toHaveText(
    'No se pudo copiar. Selecciona y copia la dirección de abajo o inténtalo de nuevo.'
  )

  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  const section = page.locator('[data-section-copy]').first()
  const sectionId = await section.evaluate(element => element.id)

  await section.click()
  await expect(section).toHaveAccessibleName(/^Vuelve a intentar copiar el enlace a la sección:/u)
  const sectionRecovery = page.locator(`[id="${sectionId}-recovery"]`)

  await expect(sectionRecovery).toBeVisible()
  await expect(sectionRecovery.getByLabel('Selecciona y copia la dirección de esta sección')).toHaveValue(
    /^https:\/\/santi020k\.com\/es\/blog\/astro-doctor-announcement\/#.+/u
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('an unvisited Spanish route receives the Spanish offline recovery document', async ({ browser, baseURL }) => {
  const server = await createOfflinePreview(baseURL)
  const context = await browser.newContext({ baseURL: server.url, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/es/')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    server.setOnline(false)
    await page.goto('/es/not-cached-locale-test/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
    await expect(page.locator('[data-connection-status]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Intentar de nuevo', exact: true })).toBeVisible()
  } finally {
    await context.close()
    await server.close()
  }
})
