import { expect, type Locator, type Page, test } from '@playwright/test'

import { getProjectColorContrast } from '../src/utils/project-brand'

const openWithTextSize = async (page: Page, route: string, textSize: number) => {
  await page.goto(route)
  await page.evaluate(async size => {
    document.documentElement.style.fontSize = `${size}%`
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
  }, textSize)
}

const expectVisibleOutline = async (surface: Locator) => {
  const visible = await surface.evaluate(element => {
    const style = getComputedStyle(element)
    const width = parseFloat(style.outlineWidth)
    const extent = width + parseFloat(style.outlineOffset)
    const bounds = element.getBoundingClientRect()
    let ancestor = element.parentElement

    if (style.outlineStyle !== 'solid' || width < 2) return false

    while (ancestor) {
      const parentStyle = getComputedStyle(ancestor)
      const parent = ancestor.getBoundingClientRect()

      if (['hidden', 'clip'].includes(parentStyle.overflowX) &&
        (bounds.left - extent < parent.left || bounds.right + extent > parent.right)) return false
      if (['hidden', 'clip'].includes(parentStyle.overflowY) &&
        (bounds.top - extent < parent.top || bounds.bottom + extent > parent.bottom)) return false
      ancestor = ancestor.parentElement
    }
    return true
  })

  expect(visible).toBe(true)
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 150, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Reading affordances at ${width}px, ${textSize}% text, ${theme}`, () => {
        test.use({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('article cards expose keyboard focus and active pagination stays readable', async ({ page, browserName }) => {
          await openWithTextSize(page, '/blog/', textSize)
          const cards = page.locator('[data-post-gallery-card]')
          const firstLink = cards.first().getByRole('link')

          await firstLink.focus()
          await expect(firstLink).toBeFocused()
          await expectVisibleOutline(cards.first())
          await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
          await expect(cards.nth(1).getByRole('link')).toBeFocused()
          await expectVisibleOutline(cards.nth(1))

          const active = page.getByRole('navigation', { name: 'Pagination', exact: true }).locator('[aria-current="page"]')
          const colors = await active.evaluate(element => {
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')

            if (!context) throw new Error('Canvas is required to resolve CSS colors')

            const readColor = () => `#${[...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
              .map(channel => channel.toString(16).padStart(2, '0')).join('')}`
            const style = getComputedStyle(element)

            // Composite the translucent button over the site's opaque canvas color.
            context.fillStyle = getComputedStyle(document.body).backgroundColor
            context.fillRect(0, 0, 1, 1)
            context.fillStyle = style.backgroundColor
            context.fillRect(0, 0, 1, 1)
            const background = readColor()

            context.fillStyle = style.color
            context.fillRect(0, 0, 1, 1)
            return { background, foreground: readColor() }
          })

          expect(getProjectColorContrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5)
        })

        test('project details keep words intact and repository icons respect reduced motion', async ({ page }) => {
          await openWithTextSize(page, '/portfolio/lumen-ui/', textSize)
          const glance = page.getByRole('region', { name: 'At a glance', exact: true })
          const terms = glance.locator('dt, dd')

          await expect(terms).toHaveCount(8)
          const brokenWords = await terms.evaluateAll(elements => elements.flatMap(element => {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
            const broken: string[] = []
            let node = walker.nextNode()

            while (node) {
              for (const match of (node.textContent ?? '').matchAll(/\b[a-z]{4,}\b/giu)) {
                const range = document.createRange()

                range.setStart(node, match.index)
                range.setEnd(node, match.index + match[0].length)
                if (range.getClientRects().length > 1) broken.push(match[0])
              }
              node = walker.nextNode()
            }
            return broken
          }))

          expect(brokenWords).toEqual([])
          const repository = page.locator('.editorial-detail-hero').getByRole('link', { name: 'Open repository' })
          const icon = repository.locator('.ui-icon').first()
          const relativePosition = () => icon.evaluate(element => {
            const link = element.closest('a')

            if (!link) throw new Error('Expected a repository link')
            return element.getBoundingClientRect().left - link.getBoundingClientRect().left
          })

          await repository.scrollIntoViewIfNeeded()
          const before = await relativePosition()

          await repository.hover()
          await page.evaluate(async () => {
            await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
              resolve()
            })))
          })
          expect(await relativePosition()).toBeCloseTo(before, 2)
        })
      })
    }
  }
}
