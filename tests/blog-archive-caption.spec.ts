import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''
  const articlesLabel = locale === 'es' ? 'Artículos' : 'Articles'
  const ofLabel = locale === 'es' ? 'de' : 'of'
  const heading = locale === 'es' ? 'Del archivo.' : 'From the archive.'

  test(`Archive caption follows the displayed range, including the final page: ${locale}`, async ({ page }) => {
    await page.goto(`${prefix}/blog/`)
    await expect(page.locator('[data-blog-archive-caption]')).toHaveCount(0)
    const total = Number.parseInt(await page.locator('[data-blog-primary-path] p').innerText(), 10)
    const pageSize = await page.locator('#posts [data-post-gallery-card]').count()
    const lastPage = Math.ceil(total / pageSize)

    expect(total).toBeGreaterThan(pageSize)
    for (const number of [2, lastPage]) {
      await page.goto(`${prefix}/blog/${number}/`)
      const caption = page.locator('[data-blog-archive-caption]')
      const count = await page.locator('#posts [data-post-gallery-card]').count()
      const start = (number - 1) * pageSize + 1
      const end = start + count - 1

      await expect(caption.locator('p')).toHaveText(`${articlesLabel} ${start}–${end} ${ofLabel} ${total}`)
      await expect(caption.getByRole('heading', { level: 2 })).toHaveText(heading)
      await expect(caption.locator('p')).toHaveCount(1)
      await expect(page.locator('[data-blog-archive-spread]')).toBeVisible()
    }
  })

  test(`Archive caption reflows with pointer and keyboard topic navigation: ${locale}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${prefix}/blog/2/#posts`)
    const caption = page.locator('[data-blog-archive-caption]')
    const guide = page.locator('[data-blog-topic-guide]')
    const catalog = guide.locator('[data-topic-guide-catalog]')

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)
      for (const [width, size] of [[1440, 100], [768, 100], [390, 100], [320, 200]] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        expect(await caption.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const range = document.createRange()

          range.selectNodeContents(element)
          return [...range.getClientRects()].every(rect => (
            rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
          ))
        })).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
      await page.setViewportSize({ width: 1440, height: 1100 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '100%'
      })
      const pointerTargets = [
        '[data-topic-guide-catalog]', '[data-sculpted-tag]', '[data-sculpted-tag-label]', '[data-sculpted-tag-count]'
      ]

      for (const selector of pointerTargets) {
        const target = guide.locator(selector).first()

        await target.hover()
        await expect(target).toHaveCSS('cursor', 'pointer')
      }
      await expectNoUnexpectedAccessibilityViolations(page)
    }
    await catalog.focus()
    await expect(catalog).toHaveCSS('outline-style', 'solid')
    await catalog.press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/tags/`)
  })

  test.describe(`Archive caption without JavaScript: ${locale}`, () => {
    test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

    test('retains the introduction and native topic destinations', async ({ page }) => {
      await page.goto(`${prefix}/blog/2/#posts`)
      await expect(page.locator('[data-blog-archive-caption] h2')).toHaveText(heading)
      await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded')
      await page.locator(`[data-blog-topic-guide] a[href="${prefix}/blog/tags/typescript/"]`).press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/tags/typescript/`)
    })
  })
}
