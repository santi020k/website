import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''
  const name = locale === 'es' ? 'Temas relacionados' : 'Related topics'

  test(`${locale} articles lead the archive before pagination and related topics`, async ({ page, browserName }) => {
    for (const archive of [
      { path: 'wine', posts: 1, continuation: '[data-topic-guide-catalog]', middle: [] },
      { path: 'developer-tools', posts: 2, continuation: '[data-topic-guide-catalog]', middle: [] },
      { path: 'developer-experience', posts: 12, continuation: '[data-pager-number]', middle: ['data-split-pager'] },
      { path: 'developer-experience/2', posts: 4, continuation: '[data-pager-number]', middle: ['data-split-pager'] },
      { path: 'typescript/2', posts: 1, continuation: '[data-pager-number]', middle: ['data-split-pager'] }
    ]) {
      await page.goto(`${prefix}/blog/tags/${archive.path}/`)
      const reading = page.locator('[data-topic-reading]')
      const order = await reading.locator('[data-topic-reading-caption], [data-post-gallery-grid], [data-split-pager], [data-blog-topic-guide]').evaluateAll(elements => elements.map(element => element.getAttributeNames().find(attribute => ['data-topic-reading-caption', 'data-post-gallery-grid', 'data-split-pager', 'data-blog-topic-guide'].includes(attribute))))

      expect(order).toEqual(['data-topic-reading-caption', 'data-post-gallery-grid', ...archive.middle, 'data-blog-topic-guide'])
      await expect(page.locator('[data-post-gallery-card]')).toHaveCount(archive.posts)
      await expect(page.getByRole('navigation', { name, exact: true })).toHaveCount(1)
      await page.locator('[data-post-gallery-card] a').last().focus()
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(reading.locator(archive.continuation).first()).toBeFocused()
    }
  })

  test(`${locale} related topics use the full archive on every page and retain destination totals`, async ({ page }) => {
    for (const suffix of ['', '2/']) {
      await page.goto(`${prefix}/blog/tags/developer-experience/${suffix}`)
      const related = page.getByRole('navigation', { name, exact: true })
      await expect(related.locator('[data-sculpted-tag-label]')).toHaveText(['Open source', 'ESLint', 'TypeScript', 'AI'])
      await expect(related.locator('[data-sculpted-tag-count]')).toHaveText(['8', '7', '13', '3'])
      await expect(related.locator('[aria-current]')).toHaveCount(0)
      await expect(related.locator('a[href$="/developer-experience/"]')).toHaveCount(0)
      expect(await related.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(
        ['open-source', 'eslint', 'typescript', 'ai'].map(slug => `${prefix}/blog/tags/${slug}/`)
      )
      const catalog = page.locator('[data-topic-guide-catalog]')
      await expect(catalog).toHaveText(locale === 'es' ? 'Los 112 temas' : 'All 112 topics')
      await expect(catalog).toHaveAttribute('href', `${prefix}/blog/tags/`)
    }

    await page.getByRole('navigation', { name, exact: true }).getByRole('link', { name: /Open source/u }).press('Enter')
    await expect(page).toHaveURL(`${prefix}/blog/tags/open-source/`)
    await expect(page.locator('#main')).toBeFocused()
    await expect(page.locator('[data-topic-archive-count]')).toHaveText(locale === 'es' ? '8 artículos' : '8 posts')
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(8)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} related tags preserve sculpted feedback, pointer targets, and reflow in ${theme}`, async ({ page, browserName }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(`${prefix}/blog/tags/developer-experience/`)
      const related = page.getByRole('navigation', { name, exact: true })
      const link = related.getByRole('link', { name: /Open source/u })
      const count = link.locator('[data-sculpted-tag-count]')
      const label = link.locator('[data-sculpted-tag-label]')
      await related.scrollIntoViewIfNeeded()
      const initialBox = await link.boundingBox()
      const initialColor = await count.evaluate(element => getComputedStyle(element).backgroundColor)

      await count.hover()
      for (const target of [link, label, count]) await expect(target).toHaveCSS('cursor', 'pointer')
      await expect(count).not.toHaveCSS('background-color', initialColor)
      await expect(link).not.toHaveCSS('box-shadow', 'none')
      await expect(label).toHaveCSS('text-decoration-line', 'underline')
      expect(await link.boundingBox()).toEqual(initialBox)
      await page.locator('[data-topic-guide-catalog]').focus()
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(link).toBeFocused()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(link).toHaveCSS('transition-property', 'none')
      await expect(count).toHaveCSS('transition-property', 'none')

      for (const [width, text] of [[390, '100%'], [1440, '100%'], [320, '200%']] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, text)
        const boxes = await related.getByRole('link').evaluateAll(links => links.map(element => {
          const rect = element.getBoundingClientRect()
          return rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth + 1 &&
            element.scrollWidth <= element.clientWidth + 1
        }))
        expect(boxes.every(Boolean)).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }

  test.describe(`${locale} related topics without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('native links reach the full topic archive and catalog', async ({ page }) => {
      await page.goto(`${prefix}/blog/tags/developer-experience/2/`)
      const link = page.getByRole('navigation', { name, exact: true }).getByRole('link', { name: /TypeScript/u })
      await expect(link).not.toHaveAttribute('target', '_blank')
      await link.press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/tags/typescript/`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('TypeScript')
      await page.locator('[data-topic-guide-catalog]').press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/tags/`)
    })
  })
}
