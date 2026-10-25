import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

const ARTICLE = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'
const ESLINT_ARTICLE = '/blog/designing-eslint-packages-teams-actually-adopt/'

for (const theme of ['light', 'dark']) {
  test(`directional folio keeps adjacent articles readable and navigable in ${theme}`, async ({ page, browserName }) => {
    await page.route('https://giscus.app/**', route => route.abort())
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ESLINT_ARTICLE)
    const navigation = page.getByRole('navigation', { name: 'Continue reading ESLint in Practice' })
    const previous = navigation.getByRole('link', { name: /Previous in series/u })
    const next = navigation.getByRole('link', { name: /Next in series/u })

    await expect(previous).toHaveAttribute('href', '/blog/why-i-moved-my-eslint-library-to-eslint-config-basic/')
    await expect(previous).toContainText('Part 03')
    await expect(next).toHaveAttribute('href', '/blog/eslint-config-basic-version-2/')
    await expect(next).toContainText('Part 05')
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const textSize of ['100%', '200%']) {
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = value
          await document.fonts.ready
        }, textSize)
        for (const link of [previous, next]) {
          await link.focus()
          await expect(link).toHaveCSS('outline-style', 'solid')
          for (const copy of await link.locator('h3, [data-series-adjacent-direction], [data-series-adjacent-part]').all()) {
            const fits = await copy.evaluate(element => {
              const widthFits = element.scrollWidth <= element.clientWidth + 1
              const heightFits = element.scrollHeight <= element.clientHeight + 1

              return widthFits && heightFits
            })

            expect(fits).toBe(true)
          }
          const bounds = requireValue(await link.boundingBox())

          expect(bounds.x).toBeGreaterThanOrEqual(4)
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width - 4)
          expect(bounds.height).toBeGreaterThanOrEqual(44)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
    await previous.focus()
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(next).toBeFocused()
    const title = next.locator('h3')
    const focusedColor = await title.evaluate(element => getComputedStyle(element).color)

    await next.evaluate(element => {
      element.blur()
    })
    await next.hover()
    await expect(title).toHaveCSS('color', focusedColor)
    await expect(title).toHaveCSS('transition-property', 'none')
    await next.focus()
    await next.press('Enter')
    await expect(page).toHaveURL('/blog/eslint-config-basic-version-2/')
    await expect(page.locator('[data-series-pagination] a')).toHaveCount(1)
    await expect(page.locator('[data-series-pagination] a')).toContainText('Part 04')
  })
}

for (const theme of ['light', 'dark']) {
  test(`reading index preserves long chapter titles and current status in ${theme}`, async ({ page }) => {
    // Remote comment content has its own lifecycle coverage and must not affect this audit.
    await page.route('https://giscus.app/**', route => route.abort())
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ESLINT_ARTICLE)
    const chapters = page.getByRole('navigation', { name: 'Chapters in ESLint in Practice' })
    const links = chapters.getByRole('link')

    await expect(links).toHaveCount(5)
    await expect(chapters.locator('[aria-current="step"]')).toHaveCount(1)
    await expect(links.nth(3)).toContainText('Reading now')
    await expect(links.nth(3)).toHaveAttribute('aria-current', 'step')
    for (const width of [320, 375, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 })
      for (const textSize of ['100%', '200%']) {
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = value
          await document.fonts.ready
        }, textSize)
        await chapters.scrollIntoViewIfNeeded()
        const numberLines = await chapters.locator('[data-series-step-number] [aria-hidden]').evaluateAll(numbers => numbers.map(number => {
          const range = document.createRange()

          range.selectNodeContents(number)
          return [...range.getClientRects()].filter(rect => rect.width > 0).length
        }))

        expect(numberLines).toEqual(Array.from({ length: 5 }, () => 1))
        for (const title of await chapters.locator('[data-series-step-title]').all()) {
          const layout = await title.evaluate(element => ({
            width: element.clientWidth,
            contentWidth: element.scrollWidth,
            height: element.clientHeight,
            contentHeight: element.scrollHeight
          }))

          expect(layout.contentWidth).toBeLessThanOrEqual(layout.width + 1)
          expect(layout.contentHeight).toBeLessThanOrEqual(layout.height + 1)
        }
        const bounds = requireValue(await chapters.boundingBox())

        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test.describe('Reading index without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('opens the first and last chapters with the correct current status', async ({ page }) => {
    await page.goto(ESLINT_ARTICLE)
    const chapters = page.getByRole('navigation', { name: 'Chapters in ESLint in Practice' })
    const links = chapters.getByRole('link')

    for (const endpoint of [0, 4]) {
      const link = links.nth(endpoint)
      const destination = requireValue(await link.getAttribute('href'))

      await link.focus()
      await link.press('Enter')
      await expect(page).toHaveURL(destination)
      await expect(links.nth(endpoint)).toHaveAttribute('aria-current', 'step')
      await expect(links.nth(endpoint)).toContainText('Reading now')
      await expect(chapters.locator('[aria-current="step"]')).toHaveCount(1)
      await expect(page.locator('[data-series-pagination] a')).toHaveCount(1)
    }

    const previous = page.locator('[data-series-pagination] a')

    await previous.focus()
    await previous.press('Enter')
    await expect(page).toHaveURL(ESLINT_ARTICLE)
    await expect(page.locator('[data-series-pagination] a')).toHaveCount(2)
  })
})

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
              const bounds = element.getBoundingClientRect()
              const outset = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth)

              return style.outlineStyle === 'solid' && parseFloat(style.outlineWidth) >= 2 &&
                bounds.left - outset >= 0 && bounds.right + outset <= window.innerWidth
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
        const bounds = element.getBoundingClientRect()
        const outset = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth)

        return style.outlineStyle === 'solid' && parseFloat(style.outlineWidth) >= 2 &&
          bounds.left - outset >= 0 && bounds.right + outset <= window.innerWidth
      })

      expect(visible).toBe(true)
      const destination = requireValue(await adjacent.getAttribute('href'))

      await adjacent.press('Enter')
      await expect(page).toHaveURL(destination)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }
})
