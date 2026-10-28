import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const articles = [
  {
    name: 'series',
    path: '/blog/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library/',
    destination: 'https://towardsdev.com/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library-3a4cbc1993a7'
  },
  {
    name: 'standalone',
    path: '/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/',
    destination: 'https://towardsdev.com/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set-482623476dcf'
  }
] as const
const layouts = [
  { width: 320, size: 100, theme: 'light', locale: 'en' },
  { width: 390, size: 200, theme: 'dark', locale: 'es' },
  { width: 1440, size: 100, theme: 'dark', locale: 'en' },
  { width: 1440, size: 200, theme: 'light', locale: 'es' }
] as const
const tabKey = { chromium: 'Tab', firefox: 'Tab', webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab' }

test.use({ reducedMotion: 'reduce' })

for (const article of articles) {
  for (const layout of layouts) {
    test(`${article.name} imprint fits ${layout.width}px at ${layout.size}% in ${layout.theme}/${layout.locale}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width: layout.width, height: 1000 })
      await page.addInitScript(theme => {
        localStorage.setItem('theme', theme)
      }, layout.theme)
      await page.goto(`${layout.locale === 'es' ? '/es' : ''}${article.path}`)
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = `${size}%`
        await document.fonts.ready
      }, layout.size)
      const credit = page.locator('[data-article-publication]')
      const publisher = credit.getByRole('link', { name: 'Towards Dev', exact: true })
      const original = credit.getByRole('link', { name: layout.locale === 'es' ? 'Leer original' : 'Read original', exact: true })

      await expect(credit).toHaveCount(1)
      await expect(credit).toHaveAccessibleName(layout.locale === 'es' ? 'Publicación original' : 'Original publication')
      await expect(credit.locator('[data-publication-platform]')).toHaveText(layout.locale === 'es' ? 'En Medium' : 'On Medium')
      await expect(publisher).toHaveAttribute('href', 'https://towardsdev.com')
      await expect(original).toHaveAttribute('href', article.destination)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', article.destination)
      await expect(page.locator('[data-article-prose]')).not.toContainText('was originally published in')
      await expect(page.locator('[data-article-prose]')).not.toContainText('where people are continuing the conversation')
      await credit.scrollIntoViewIfNeeded()
      for (const link of [publisher, original]) {
        await expect(link).toHaveAttribute('target', '_blank')
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        expect(await link.evaluate(element => {
          const rect = element.getBoundingClientRect()

          return rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth &&
            element.scrollWidth <= element.clientWidth + 1
        })).toBe(true)
      }
      const fits = await credit.evaluate(element => {
        const creditFits = element.scrollWidth <= element.clientWidth + 1
        const pageFits = document.documentElement.scrollWidth <= innerWidth

        return creditFits && pageFits
      })

      expect(fits).toBe(true)
      await page.keyboard.press(tabKey[browserName])
      await publisher.focus()
      await expect(publisher).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press(tabKey[browserName])
      await expect(original).toBeFocused()
      await expect(original).toHaveCSS('outline-style', 'solid')
      expect((await new AxeBuilder({ page }).include('[data-article-publication]').analyze()).violations).toEqual([])
    })
  }

  test(`${article.name} imprint joins the print references and remains available without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 672, height: 1000 } })
    const page = await context.newPage()

    await page.goto(article.path)
    const credit = page.locator('[data-article-publication]')

    await expect(credit.getByRole('link', { name: 'Read original', exact: true })).toHaveAttribute('href', article.destination)
    for (const marker of await credit.locator('[data-print-reference]').all()) await expect(marker).toBeHidden()
    await page.emulateMedia({ media: 'print' })
    await expect(credit).toBeVisible()
    await expect(credit.locator('[data-publication-arrow]')).toBeHidden()
    const markers = credit.locator('[data-print-reference]')

    await expect(markers).toHaveCount(2)
    for (const [index, marker] of (await markers.all()).entries()) {
      await expect(marker).toBeVisible()
      const href = await marker.locator('a').getAttribute('href')
      const reference = page.locator(href ?? '#missing-reference')

      await expect(reference).toBeVisible()
      await expect(reference.locator('a')).toHaveAttribute('href', index === 0 ? 'https://towardsdev.com/' : article.destination)
    }
    const hrefs = await page.locator('[data-article-print-references] li > a').evaluateAll(links => links.map(link => link.getAttribute('href')))

    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(await credit.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await context.close()
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`imprint hovers keep their geometry and respect reduced motion in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto(articles[0].path)
    const credit = page.locator('[data-article-publication]')

    await credit.scrollIntoViewIfNeeded()
    for (const selector of ['[data-publication-publisher]', '[data-publication-original]']) {
      const link = credit.locator(selector)
      const bounds = await link.boundingBox()

      await link.hover()
      expect(await link.boundingBox()).toEqual(bounds)
      await expect(link).toHaveCSS('transition-property', 'none')
      expect((await new AxeBuilder({ page }).include('[data-article-publication]').analyze()).violations).toEqual([])
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(credit.locator('[data-arrow-track]')).toHaveCSS('animation-duration', '0.48s')
  })
}

test('articles without an explicit publisher credit keep their existing closing', async ({ page }) => {
  for (const path of [
    '/blog/playwright-accessibility-checks-that-teams-keep-running/',
    '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/'
  ]) {
    await page.goto(path)
    await expect(page.locator('[data-article-publication]')).toHaveCount(0)
  }
})
