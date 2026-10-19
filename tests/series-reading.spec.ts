import { expect, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const ARTICLE = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'

for (const width of [390, 1440]) {
  for (const textSize of [100, 150, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Series reading at ${width}px, ${textSize}% text, ${theme}`, () => {
        test.use({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('titles stay readable and keyboard focus stays inside clipped rows', async ({ page, browserName }) => {
          await page.addInitScript(size => {
            const apply = () => {
              const root = document.querySelector('html')

              if (!root) return false
              root.style.fontSize = `${size}%`
              return true
            }

            if (!apply()) {
              const observer = new MutationObserver(() => {
                if (apply()) observer.disconnect()
              })

              observer.observe(document, { childList: true })
            }
          }, textSize)
          await page.goto(ARTICLE)
          await page.evaluate(async () => {
            await document.fonts.ready
          })
          await expect(page.locator('html')).toHaveCSS('font-size', `${16 * textSize / 100}px`)

          // aria-current identifies the article's series, excluding breadcrumbs and TOC.
          const track = page.locator('ol').filter({ has: page.locator('a[aria-current="step"]') })
          const steps = track.locator('a')

          expect(await steps.count()).toBeGreaterThan(2)
          const splitWords = await steps.evaluateAll(elements => elements.flatMap(element => {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
            const split: string[] = []
            let node = walker.nextNode()

            while (node) {
              for (const match of (node.textContent ?? '').matchAll(/\b[a-z]{5,}\b/giu)) {
                const range = document.createRange()

                range.setStart(node, match.index)
                range.setEnd(node, match.index + match[0].length)
                if (range.getClientRects().length > 1) split.push(match[0])
              }
              node = walker.nextNode()
            }
            return split
          }))

          expect(splitWords).toEqual([])

          for (const step of [steps.first(), steps.last()]) {
            await step.focus()
            await expect(step).toBeFocused()
            const focusFits = await step.evaluate(element => {
              const style = getComputedStyle(element)
              const inset = -parseFloat(style.outlineOffset)

              return style.outlineStyle === 'solid' && parseFloat(style.outlineWidth) >= 2 &&
                inset >= parseFloat(style.outlineWidth)
            })

            expect(focusFits).toBe(true)
          }

          await steps.first().focus()
          await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
          await expect(steps.nth(1)).toBeFocused()

          const pager = page.locator('[data-series-pagination] a')

          await expect(pager).toHaveCount(2)
          for (const link of await pager.all()) {
            await link.focus()
            await expect(link).toBeFocused()
            const outlineFits = await link.evaluate(element => {
              const style = getComputedStyle(element)

              return -parseFloat(style.outlineOffset) >= parseFloat(style.outlineWidth)
            })

            expect(outlineFits).toBe(true)
          }
        })
      })
    }
  }
}

test.describe('Series endpoints with enlarged text', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })

  for (const route of [
    '/blog/skin-in-the-game-for-software-teams/',
    '/blog/building-santi020k-developer-tool-ecosystem/'
  ]) {
    test(`${route} keeps its single adjacent-post link visible to keyboard users`, async ({ page }) => {
      await page.goto(route)
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%'
        await document.fonts.ready
      })
      const adjacent = page.locator('[data-series-pagination] a')

      await expect(adjacent).toHaveCount(1)
      await adjacent.focus()
      await expect(adjacent).toBeFocused()
      const visible = await adjacent.evaluate(element => {
        const style = getComputedStyle(element)

        return style.outlineStyle === 'solid' && parseFloat(style.outlineWidth) >= 2 &&
          -parseFloat(style.outlineOffset) >= parseFloat(style.outlineWidth)
      })

      expect(visible).toBe(true)
      const destination = requireValue(await adjacent.getAttribute('href'))

      await adjacent.press('Enter')
      await expect(page).toHaveURL(destination)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }
})
