import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} focused topic cover and copy reflow accessibly in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(`${prefix}/blog/tags/wine/`)
      const gallery = page.locator('[data-post-gallery-grid]')
      const card = gallery.locator('[data-post-gallery-card]')
      const link = card.getByRole('link')
      await expect(gallery).toHaveAttribute('data-post-gallery-grid', 'focused')
      await expect(card).toHaveCount(1)
      await expect(card.locator('[data-post-gallery-topics] li > [lang="en"]')).toHaveText(['macOS', 'Apple silicon'])
      await expect(card.locator('[data-post-topic-separator]')).toHaveAttribute('aria-hidden', 'true')

      for (const [width, size, spread] of [[1440, '100%', true], [768, '100%', true], [390, '100%', false], [320, '200%', false]] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        const geometry = await card.evaluate(element => {
          const cover = element.querySelector('[data-post-gallery-cover]')?.getBoundingClientRect()
          const copy = element.querySelector('[data-post-gallery-copy]')?.getBoundingClientRect()
          if (!cover || !copy) throw new Error('Missing focused cover or copy')

          return {
            spread: copy.left > cover.right,
            stacked: copy.top > cover.bottom,
            aspectRatio: cover.width / cover.height,
            fits: [...element.querySelectorAll('h3,p,ul,a,[data-post-gallery-meta],[data-post-gallery-footer]')].every(child => {
              const rect = child.getBoundingClientRect()
              return child.scrollWidth <= child.clientWidth + 1 && rect.left >= 0 && rect.right <= innerWidth + 1
            })
          }
        })
        expect(geometry.spread).toBe(spread)
        expect(geometry.stacked).toBe(!spread)
        expect(geometry.aspectRatio).toBeCloseTo(16 / 9, 2)
        expect(geometry.fits).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }

      await page.evaluate(() => {
        document.documentElement.style.fontSize = '100%'
      })
      await page.setViewportSize({ width: 1440, height: 1100 })
      await link.scrollIntoViewIfNeeded()
      const coverBounds = await card.locator('[data-post-gallery-cover]').boundingBox()
      await link.hover()
      expect(await card.locator('[data-post-gallery-cover]').boundingBox()).toEqual(coverBounds)
      await link.focus()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(card.locator('h3')).toHaveCSS('transition-duration', '0.001s')
      await expectNoUnexpectedAccessibilityViolations(page)
      await link.press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/run-repo-on-mac-with-silo-dxmt/`)
      await expect(page.locator('#main')).toBeFocused()
    })
  }

  test(`${locale} two-post topics fill a balanced shelf and stack on phones`, async ({ page }) => {
    await page.goto(`${prefix}/blog/tags/ios/`)
    const cards = page.locator('[data-post-gallery-card]')
    await expect(cards).toHaveCount(2)
    await page.setViewportSize({ width: 1440, height: 1100 })
    const geometry = await cards.evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect()
      const footer = element.querySelector('[data-post-gallery-footer]')?.getBoundingClientRect()
      return { x: box.x, top: box.top, width: box.width, right: box.right, footer: footer?.top }
    }))
    expect(geometry[0]?.top).toBe(geometry[1]?.top)
    expect(geometry[0]?.footer).toBe(geometry[1]?.footer)
    expect(geometry[0]?.width).toBeCloseTo(geometry[1]?.width ?? 0, 1)
    expect(geometry[0]?.width).toBeGreaterThan(500)
    await page.setViewportSize({ width: 390, height: 1100 })
    const positions = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().x))
    expect(positions[0]).toBe(positions[1])
  })

  test(`${locale} larger archives and other gallery consumers retain their layouts`, async ({ page }) => {
    for (const slug of ['macos/', 'developer-experience/', 'developer-experience/2/', 'typescript/2/']) {
      await page.goto(`${prefix}/blog/tags/${slug}`)
      await expect(page.locator('[data-post-gallery-grid]')).toHaveAttribute('data-post-gallery-grid', 'grid')
      await expect(page.locator('[data-post-gallery-grid]')).toHaveClass(/lg:card-grid-3/u)
    }
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(1)
    await page.goto(`${prefix}/blog/`)
    await expect(page.locator('[data-post-gallery-grid]')).toHaveAttribute('data-post-gallery-grid', 'grid')
    await page.goto(`${prefix}/blog/series/eslint-in-practice/`)
    await expect(page.locator('[data-post-gallery-grid]')).toHaveAttribute('data-post-gallery-grid', 'chapters')
  })

  const captionExamples = [
    { route: '/blog/', post: 'postlens-2-is-live', labels: ['iOS', 'SwiftUI'] },
    { route: '/blog/tags/developer-tools/', post: 'building-santi020k-developer-tool-ecosystem', labels: ['Developer experience', 'Developer tools'] },
    { route: '/blog/series/eslint-in-practice/', labels: ['ESLint', 'TypeScript'] },
    { route: '/developer-experience/', labels: ['Developer experience', 'Engineering culture'] },
    { route: '/blog/run-repo-on-mac-with-silo-dxmt/', labels: ['macOS', 'Swift'] }
  ].map(example => ({
    ...example,
    selector: example.post ? `[data-post-gallery-card]:has(a[href="${prefix}/blog/${example.post}/"])` : '[data-post-gallery-card]'
  }))

  test(`${locale} shared article cards use named captions without nested links`, async ({ page }) => {
    for (const example of captionExamples) {
      await page.goto(`${prefix}${example.route}`)
      const card = page.locator(example.selector).first()
      const topics = card.getByRole('list', { name: locale === 'es' ? 'Temas' : 'Topics', exact: true })
      await expect(topics.locator('li > [lang="en"]')).toHaveText(example.labels)
      await expect(topics.getByRole('link')).toHaveCount(0)
      await expect(card.getByRole('link')).toHaveCount(1)
      await expect(topics.locator('[data-post-topic-separator]')).toHaveCount(1)
      await expect(topics).toHaveAccessibleName(locale === 'es' ? 'Temas' : 'Topics')
      for (const [width, size] of [[390, '100%'], [320, '200%']] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        expect(await topics.evaluate(element => [...element.querySelectorAll('li')].every(item => item.scrollWidth <= item.clientWidth + 1))).toBe(true)
      }
    }
  })

  const nativeReadingTitle = locale === 'es' ?
    'Cómo logré ejecutar R.E.P.O. en Mac sin Whisky' :
    'How I Got R.E.P.O. Running on Mac Without Whisky'

  test.describe(`${locale} focused gallery without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('the complete article card remains a native reading destination', async ({ page }) => {
      await page.goto(`${prefix}/blog/tags/wine/`)
      const link = page.locator('[data-post-gallery-card] > a')
      await expect(link.locator('[data-post-gallery-topics] li > [lang="en"]')).toHaveText(['macOS', 'Apple silicon'])
      await expect(link).not.toHaveAttribute('target', '_blank')
      await link.press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/run-repo-on-mac-with-silo-dxmt/`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(nativeReadingTitle)
    })
  })
}
