import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Homepage integration in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('the opening, sections, and footer share one spacing rhythm', async ({ page }) => {
      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/')
        await page.evaluate(() => document.fonts.ready)

        const measurements = await page.evaluate(() => {
          const hero = document.querySelector('[data-home-hero]')?.getBoundingClientRect()
          const stats = document.querySelector('.studio-stats')?.getBoundingClientRect()
          const firstStat = document.querySelector('.studio-stat')?.getBoundingClientRect()
          const heading = document.querySelector('.studio-section-heading')?.getBoundingClientRect()
          const community = document.querySelector('[data-home-community]')?.getBoundingClientRect()
          const footer = document.querySelector('[data-site-footer]')?.getBoundingClientRect()

          if (!hero || !stats || !firstStat || !heading || !community || !footer) {
            throw new Error('The complete homepage must be rendered')
          }

          return {
            openingGap: firstStat.top - hero.bottom,
            sectionGap: heading.top - stats.bottom,
            closingGap: footer.top - community.bottom,
            leftEdges: [hero.left, stats.left, heading.left, community.left],
            rightEdges: [hero.right, stats.right, heading.right, community.right]
          }
        })

        expect(measurements.openingGap).toBeGreaterThan(0)
        expect(measurements.openingGap).toBeCloseTo(measurements.sectionGap, 0)
        expect(measurements.closingGap).toBeCloseTo(measurements.sectionGap, 0)
        expect(new Set(measurements.leftEdges).size).toBe(1)
        expect(new Set(measurements.rightEdges).size).toBe(1)
      }
    })

    test('shared introductions keep whole words and readable columns at enlarged text', async ({ page }) => {
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/')
        await page.evaluate(async () => {
          document.documentElement.style.fontSize = '200%'
          await document.fonts.ready
        })

        const headings = page.locator('.studio-section-heading')

        await expect(headings).toHaveCount(3)
        for (const heading of await headings.all()) {
          const layout = await heading.evaluate(element => {
            const title = element.querySelector('h2')
            const introduction = element.querySelector('.studio-section-intro')

            if (!(title instanceof HTMLElement) || !(introduction instanceof HTMLElement)) {
              throw new Error('A section introduction needs its heading and supporting copy')
            }

            const titleBounds = title.getBoundingClientRect()
            const introBounds = introduction.getBoundingClientRect()
            const splitWords: string[] = []
            const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT)
            const range = document.createRange()

            while (walker.nextNode()) {
              const node = walker.currentNode

              for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
                range.setStart(node, match.index)
                range.setEnd(node, match.index + match[0].length)
                const rectangles = [...range.getClientRects()].filter(rect => rect.width > 0)
                const lines = new Set(rectangles.map(rect => Math.round(rect.top)))

                if (lines.size > 1) splitWords.push(match[0])
              }
            }

            return {
              titleBottom: titleBounds.bottom,
              introTop: introBounds.top,
              titleLeft: titleBounds.left,
              introLeft: introBounds.left,
              splitWords,
              fits: title.scrollWidth <= title.clientWidth + 1
            }
          })

          expect(layout.splitWords, `${width}px: headings should preserve whole words`).toEqual([])
          expect(layout.fits).toBe(true)
          expect(layout.introTop).toBeGreaterThan(layout.titleBottom)
          expect(layout.introLeft).toBe(layout.titleLeft)
          const action = heading.getByRole('link')

          await action.focus()
          await expect(action).toBeFocused()
          await expect(action).toBeInViewport()
          await expect(action).toHaveCSS('outline-style', 'solid')
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    })
  })
}
