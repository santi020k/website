import { expect, test } from '@playwright/test'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''

  test(`${locale} topic brief follows pagination and keeps return links in the locale`, async ({ page }) => {
    await page.goto(`${prefix}/blog/tags/developer-experience/`)
    const opening = page.locator('[data-topic-archive-opening]')

    await expect(opening.getByRole('heading', { level: 1 })).toHaveText('Developer experience')
    await expect(opening.locator('[data-topic-archive-count]')).toHaveText(locale === 'es' ? '16 artículos' : '16 posts')
    await expect(opening.locator('[data-topic-archive-position]')).toHaveText(locale === 'es' ? 'Más recientes primero · Página 1 de 2' : 'Latest first · Page 1 of 2')
    await page.getByRole('link', { name: locale === 'es' ? 'Página siguiente' : 'Next page', exact: true }).click()
    await expect(page).toHaveURL(`${prefix}/blog/tags/developer-experience/2/`)
    await expect(opening.getByRole('heading', { level: 1 })).toHaveText('Developer experience')
    await expect(opening.locator('[data-topic-archive-position]')).toHaveText(locale === 'es' ? 'Más recientes primero · Página 2 de 2' : 'Latest first · Page 2 of 2')
    const allTopics = opening.getByRole('link', { name: locale === 'es' ? 'Todos los temas' : 'All topics', exact: true })

    await allTopics.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/tags/`)

    await page.goto(`${prefix}/blog/tags/wine/`)
    await expect(opening.locator('[data-topic-archive-count]')).toHaveText(locale === 'es' ? '1 artículo' : '1 post')
    await expect(opening.locator('[data-topic-archive-position]')).toHaveText(locale === 'es' ? 'Más recientes primero' : 'Latest first')
    const blog = opening.getByRole('link', { name: locale === 'es' ? 'Volver al blog' : 'Back to blog', exact: true })

    await blog.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/`)
  })
}
