import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''

  test(`${locale} topic brief follows pagination and keeps return links in the locale`, async ({ page }) => {
    await page.goto(`${prefix}/blog/tags/developer-experience/`)
    const opening = page.locator('[data-topic-archive-opening]')

    await expect(opening.getByRole('heading', { level: 1 })).toHaveText('Developer experience')
    const description = await opening.locator('[data-topic-archive-description]').innerText()

    expect(description).toContain(locale === 'es' ? 'Herramientas y prácticas' : 'Tools and practices')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description)
    await expect(opening.locator('[data-topic-archive-count]')).toHaveText(locale === 'es' ? '16 artículos' : '16 posts')
    await expect(opening.locator('[data-topic-archive-position]')).toHaveText(locale === 'es' ? 'Más recientes primero · Página 1 de 2' : 'Latest first · Page 1 of 2')
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 2, name: locale === 'es' ? 'Artículos recientes' : 'Latest writing', exact: true })).toBeVisible()
    await expect(page.locator('[data-topic-reading-range]')).toHaveText(locale === 'es' ? 'Artículos 1–12 de 16' : 'Posts 1–12 of 16')
    await expect(page.locator('[data-post-gallery-grid] h3')).toHaveCount(12)
    await page.getByRole('link', { name: locale === 'es' ? 'Página siguiente' : 'Next page', exact: true }).click()
    await expect(page).toHaveURL(`${prefix}/blog/tags/developer-experience/2/`)
    await expect(opening.getByRole('heading', { level: 1 })).toHaveText('Developer experience')
    await expect(opening.locator('[data-topic-archive-description]')).toHaveText(description)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', `${description} ${locale === 'es' ? 'Página' : 'Page'} 2 ${locale === 'es' ? 'de' : 'of'} 2.`)
    await expect(opening.locator('[data-topic-archive-position]')).toHaveText(locale === 'es' ? 'Más recientes primero · Página 2 de 2' : 'Latest first · Page 2 of 2')
    await expect(page.getByRole('heading', { level: 2, name: locale === 'es' ? 'Artículos anteriores' : 'Earlier writing', exact: true })).toBeVisible()
    await expect(page.locator('[data-topic-reading-range]')).toHaveText(locale === 'es' ? 'Artículos 13–16 de 16' : 'Posts 13–16 of 16')
    await expect(page.locator('[data-post-gallery-grid] h3')).toHaveCount(4)
    const allTopics = opening.getByRole('link', { name: locale === 'es' ? 'Todos los temas' : 'All topics', exact: true })

    await allTopics.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/tags/`)

    await page.goto(`${prefix}/blog/tags/wine/`)
    await expect(opening.locator('[data-topic-archive-count]')).toHaveText(locale === 'es' ? '1 artículo' : '1 post')
    await expect(opening.locator('[data-topic-archive-position]')).toHaveText(locale === 'es' ? 'Más recientes primero' : 'Latest first')
    await expect(page.locator('[data-topic-reading-range]')).toHaveText(locale === 'es' ? '1 artículo' : '1 post')
    await expect(page.locator('[data-post-gallery-grid] h3')).toHaveCount(1)
    const blog = opening.getByRole('link', { name: locale === 'es' ? 'Volver al blog' : 'Back to blog', exact: true })

    await blog.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/`)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} ${theme} topic notes wrap at mobile and enlarged-text sizes`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(`${prefix}/blog/tags/engineering-culture/`)
      const opening = page.locator('[data-topic-archive-opening]')
      const note = opening.locator('[data-topic-archive-description]')

      await expect(note).toHaveCSS('max-width', /\d+(\.\d+)?px/u)
      for (const [width, fontSize] of [[1440, 100], [768, 100], [390, 100], [320, 200]] as const) {
        await page.setViewportSize({ width, height: 1000 })
        await page.addStyleTag({ content: `html { font-size: ${fontSize}% !important; }` })
        await expect(note).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
        const noteBottom = await note.evaluate(element => element.getBoundingClientRect().bottom)
        const footerTop = await opening.locator('[data-topic-archive-footer]').evaluate(element => element.getBoundingClientRect().top)

        expect(noteBottom).toBeLessThan(footerTop)
      }

      const violations = await new AxeBuilder({ page }).include('[data-topic-archive-opening]').analyze()

      expect(violations.violations).toEqual([])
      const returnLink = opening.locator('[data-topic-archive-return]')

      await returnLink.focus()
      await expect(returnLink).toBeFocused()
      await expect(returnLink).not.toHaveCSS('outline-style', 'none')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/tags/`)
    })
  }

  test.describe(`${locale} topic note without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('renders localized context and native archive navigation', async ({ page }) => {
      await page.goto(`${prefix}/blog/tags/wine/`)
      const note = page.locator('[data-topic-archive-description]')

      await expect(note).toHaveText(locale === 'es' ?
        'Cómo ejecutar juegos de Windows en Apple silicon con Wine, Silo y DXMT.' :
        'Running Windows games on Apple silicon with Wine, Silo, and DXMT.')
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', await note.innerText())
      await page.locator('[data-topic-archive-blog]').click()
      await expect(page).toHaveURL(`${prefix}/blog/`)
    })
  })
}
