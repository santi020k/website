import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test.describe('topic evidence destinations without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const { locale, prefix, description, unit, searchLabel, browseLabel } of [
    {
      locale: 'en',
      prefix: '',
      description: 'is the most explored topic.',
      unit: 'posts',
      searchLabel: 'Return to topic search',
      browseLabel: 'Browse all writing'
    },
    {
      locale: 'es',
      prefix: '/es',
      description: 'es el tema más explorado.',
      unit: 'artículos',
      searchLabel: 'Volver a buscar temas',
      browseLabel: 'Ver todos los artículos'
    }
  ]) {
    test(`keeps ${locale} topic evidence readable and links in the current language`, async ({ page }) => {
      const route = `${prefix}/blog/tags/`

      await page.goto(route)
      const topic = page.locator('[data-topic-entry]').first()
      const name = await topic.getAttribute('data-name') ?? ''
      const href = await topic.locator('a').getAttribute('href') ?? ''
      const stats = page.locator('[data-stats-section]')

      expect(name).not.toBe('')
      expect(href).not.toBe('')

      await expect(stats.getByRole('link')).toHaveCount(3)
      await expect(stats.locator('[data-stat-description]').last()).toHaveText(`${name} ${description}`)
      await expect(stats.locator('[data-stat-suffix]')).toHaveText(unit)

      const destinations = [
        { label: searchLabel, href: '#topic-index-heading' },
        { label: browseLabel, href: `${prefix}/blog/#posts` },
        { label: name, href }
      ]

      for (const destination of destinations) {
        await page.goto(route)
        const link = stats.getByRole('link', { name: destination.label, exact: true })

        await expect(link).toHaveAttribute('href', destination.href)
        await link.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new URL(destination.href, new URL(route, page.url())).href)
      }
    })
  }
})

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
