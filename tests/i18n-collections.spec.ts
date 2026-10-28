import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('Spanish collection navigation stays in Spanish', async ({ page }) => {
  await page.goto('/es/blog/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cosas que construyo')
  await expect(page.locator('[data-post-gallery-card] a').first()).toHaveAttribute('href', /^\/es\/blog\//u)
  await expect(page.locator('[data-blog-tag-filter] a').first()).toHaveAttribute('href', '/es/blog/')
  await expect(page.getByRole('link', { name: 'Página siguiente', exact: true })).toHaveAttribute('href', '/es/blog/2/')
  await page.getByRole('link', { name: 'Página siguiente', exact: true }).click()
  await expect(page).toHaveURL(/\/es\/blog\/2\/$/u)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Archivo de artículos')
})

test('topic and technology filters announce Spanish results', async ({ page }) => {
  await page.goto('/es/blog/tags/')
  await page.getByLabel('Buscar un tema').fill('typescript')
  await expect(page.locator('#tag-filter-status')).toHaveText('1 tema encontrado.')
  await expect(page.locator('#tags-list a:visible')).toHaveCount(1)
  await expect(page.locator('#tags-list a:visible')).toHaveAttribute('href', '/es/blog/tags/typescript/')

  await page.goto('/es/technologies/')
  await page.getByLabel('Buscar una tecnología').fill('React')
  await expect(page.locator('#technology-filter-status')).toContainText('encontrad')
  await expect(page.locator('[data-technology-matches-list] a').first()).toHaveAttribute('href', /^\/es\/technologies\//u)
  await expectNoUnexpectedAccessibilityViolations(page)
})

test('Spanish article shell keeps the authored article in English', async ({ page }) => {
  await page.goto('/es/blog/a-release-process-that-reduces-drama/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-419')
  await expect(page.locator('[data-article-prose]')).toHaveAttribute('lang', 'en')
  await expect(page.locator('[data-publication-field="published"] dt')).toHaveText('Publicado')
  await expect(page.locator('[data-article-prose]')).toContainText('release')
  await expectNoUnexpectedAccessibilityViolations(page)
})
