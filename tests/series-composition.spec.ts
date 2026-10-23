import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

const series = ['building-a-production-nextjs-app', 'eslint-in-practice', 'the-santi020k-way']

for (const theme of ['light', 'dark'] as const) {
  for (const slug of series) {
    test(`series composition preserves its introduction and chapter order: ${slug}, ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.goto(`/blog/series/${slug}/`)
      await page.evaluate(() => document.fonts.ready)
      const introduction = page.locator('[data-series-introduction]')
      const focus = page.locator('[data-series-focus]')
      const chapters = page.locator('[data-post-gallery-card]')
      const destinations = await chapters.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))

      expect(destinations.length).toBeGreaterThan(1)
      await expect(focus.getByRole('list')).toBeVisible()
      await expect(focus.getByRole('link')).toHaveCount(0)
      const heading = requireValue(await introduction.getByRole('heading').boundingBox())
      const focusHeading = requireValue(await focus.getByRole('heading').boundingBox())

      expect(Math.abs(heading.y - focusHeading.y)).toBeLessThan(1)
      expect(focusHeading.x).toBeGreaterThan(heading.x + heading.width)
      for (const width of [320, 390, 768, 1024, 1440]) {
        for (const textSize of [100, 200]) {
          await page.setViewportSize({ width, height: 1000 })
          await page.evaluate(async size => {
            document.documentElement.style.fontSize = `${size}%`
            await document.fonts.ready
          }, textSize)
          const clipped = await page.locator('[data-series-overview], [data-post-gallery-grid]').evaluateAll(sections => sections.flatMap(section => {
            const bounds = section.getBoundingClientRect()

            return [...section.querySelectorAll('h2, h3, p, li, time, [data-post-gallery-footer]')].filter(copy => {
              const range = document.createRange()

              range.selectNodeContents(copy)
              return [...range.getClientRects()].some(rect => rect.width > 0 && (
                rect.left < bounds.left - 1 || rect.right > bounds.right + 1
              ))
            }).map(copy => copy.textContent)
          }))

          expect(clipped, `${width}px at ${textSize}%`).toEqual([])
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
          const first = requireValue(await chapters.first().boundingBox())
          const second = requireValue(await chapters.nth(1).boundingBox())

          expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 1)
        }
      }
      await expectNoUnexpectedAccessibilityViolations(page)
      expect(await chapters.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(destinations)
      const firstLink = chapters.first().getByRole('link')

      await expect(firstLink).toContainText('Part 1')
      await firstLink.focus()
      await expect(firstLink).toHaveCSS('outline-style', 'solid')
      await firstLink.press('Enter')
      await expect(page).toHaveURL(requireValue(destinations[0]))
    })
  }

  test(`editorial shelves align their complete copy in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const route of ['/blog/', '/blog/3/', '/blog/tags/developer-experience/', '/developer-experience/', '/blog/atomic-module-component-structure-for-react/']) {
        await page.goto(route)
        await page.evaluate(() => document.fonts.ready)
        const differences = await page.locator('[data-post-gallery-grid="grid"]').evaluateAll(galleries => galleries.flatMap(gallery => {
          const cards = [...gallery.querySelectorAll('[data-post-gallery-card]')]
          const issues: string[] = []

          for (const card of cards) {
            const top = card.getBoundingClientRect().top
            const neighbors = cards.filter(other => Math.abs(other.getBoundingClientRect().top - top) < 1)

            for (const selector of ['[data-post-gallery-meta]', 'h3', '[data-post-gallery-copy] > p', '[data-post-gallery-copy] > ul', '[data-post-gallery-footer]']) {
              const positions = neighbors.flatMap(neighbor => {
                const copy = neighbor.querySelector(selector)

                return copy ? [copy.getBoundingClientRect().top] : []
              })

              if (positions.length > 1 && Math.max(...positions) - Math.min(...positions) > 1) issues.push(selector)
            }
          }
          return issues
        }))

        expect(differences, `${route} at ${width}px`).toEqual([])
      }
    }
  })
}

test.describe('Series chapter navigation without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('retains chapter order and opens the final article', async ({ page }) => {
    await page.goto('/blog/series/building-a-production-nextjs-app/')
    const chapters = page.locator('[data-post-gallery-card]')
    const last = chapters.last().getByRole('link')
    const destination = requireValue(await last.getAttribute('href'))

    await expect(chapters.first()).toContainText('Part 1')
    await expect(chapters.last()).toContainText('Part 8')
    await last.click()
    await expect(page).toHaveURL(destination)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
