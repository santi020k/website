import { expect, type Locator, type Page, test } from '@playwright/test'

const openWithTextSize = async (page: Page, route: string, textSize: number) => {
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
  await page.goto(route)
  await page.evaluate(() => document.fonts.ready)
  await page.keyboard.press('Tab')
}

const expectCompleteOutline = async (surface: Locator) => {
  await expect(surface).toHaveCSS('outline-style', 'solid')
  const clipped = await surface.evaluate(element => {
    const style = getComputedStyle(element)
    const extent = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)
    const bounds = element.getBoundingClientRect()
    let ancestor = element.parentElement

    if (parseFloat(style.outlineWidth) < 2 || style.outlineColor === 'rgba(0, 0, 0, 0)') return true

    while (ancestor) {
      const parentStyle = getComputedStyle(ancestor)
      const parent = ancestor.getBoundingClientRect()

      if (['hidden', 'clip', 'auto', 'scroll'].includes(parentStyle.overflowX) &&
        (bounds.left - extent < parent.left || bounds.right + extent > parent.right)) return true
      if (['hidden', 'clip', 'auto', 'scroll'].includes(parentStyle.overflowY) &&
        (bounds.top - extent < parent.top || bounds.bottom + extent > parent.bottom)) return true
      ancestor = ancestor.parentElement
    }
    return false
  })

  expect(clipped, 'All four edges of the keyboard indicator must be visible').toBe(false)
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Card focus at ${width}px, ${textSize}% text, ${theme}`, () => {
        test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        for (const forcedColors of ['none', 'active'] as const) {
          test(`portfolio cards retain one complete keyboard indicator (${forcedColors})`, async ({ page, browserName }) => {
            await page.emulateMedia({ forcedColors })
            await openWithTextSize(page, '/portfolio/', textSize)
            expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(forcedColors === 'active')

            for (const variant of ['featured', 'supporting']) {
              const card = page.locator(`[data-portfolio-project="${variant}"]`).first()
              const link = card.locator(':scope > a')

              await expect(card.locator('a')).toHaveCount(1)
              await link.focus()
              await expect(link).toBeFocused()
              await expectCompleteOutline(card)
              const radius = await card.evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius))

              expect(radius).toBeGreaterThan(0)
              await expect(link).toHaveCSS('outline-style', 'none')
              await expect(link).toHaveCSS('box-shadow', 'none')

              await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
              await expect(link).not.toBeFocused()
              await expect(card).toHaveCSS('outline-style', 'none')
            }
          })
        }

        for (const [route, selector] of [
          ['/technologies/react-js/', '[data-project-gallery-card]']
        ] as const) {
          test(`gallery outlines follow the complete rounded cards on ${route}`, async ({ page, browserName }) => {
            await openWithTextSize(page, route, textSize)
            const cards = page.locator(selector)

            expect(await cards.count()).toBeGreaterThan(1)
            for (const card of await cards.all()) {
              const link = card.locator(':scope > a')

              await link.focus()
              await expectCompleteOutline(card)
              await expect(link).toHaveCSS('outline-style', 'none')
              await expect(card).toHaveCSS('overflow', 'hidden')
              const radius = await card.evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius))

              expect(radius).toBeGreaterThan(0)
              await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
              await expect(card).toHaveCSS('outline-style', 'none')
            }
          })
        }

        test('editorial blog links retain their complete keyboard outline', async ({ page, browserName }) => {
          await openWithTextSize(page, '/blog/', textSize)
          const cards = page.locator('[data-post-gallery-card]')

          expect(await cards.count()).toBeGreaterThan(1)
          for (const card of await cards.all()) {
            const link = card.locator(':scope > a')

            await link.focus()
            await expectCompleteOutline(link)
            await expect(card).toHaveCSS('outline-style', 'none')
            await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
            await expect(link).toHaveCSS('outline-style', 'none')
          }
        })

        test('homepage cards show a complete keyboard indicator without a pointer-only outline', async ({ page, browserName }) => {
          await openWithTextSize(page, '/', textSize)
          const cards = page.locator('.studio-project')

          await expect(cards.filter({ has: page.locator('[data-showcase-feature]') })).toHaveCount(3)
          await expect(cards.filter({ has: page.locator('[data-showcase-item]') })).toHaveCount(5)
          await expect(cards).toHaveCount(8)
          for (const card of await cards.all()) {
            const link = card.locator(':scope > a')

            await link.focus()
            await expectCompleteOutline(card)
            await expect(link).toHaveCSS('outline-style', 'none')
            await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
            await expect(card).toHaveCSS('outline-style', 'none')
          }

          // Start fresh in pointer modality. Prevent only navigation, so the real
          // mouse event still performs the browser's default focus behavior.
          await page.goto('/')
          const card = page.locator('.studio-project').first()
          const link = card.locator(':scope > a')

          await link.evaluate(element => {
            element.addEventListener('click', event => {
              event.preventDefault()
            }, { once: true })
          })
          await link.click()
          await expect(card).toHaveCSS('outline-style', 'none')
        })
      })
    }
  }
}
