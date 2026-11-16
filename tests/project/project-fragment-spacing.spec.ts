import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const expectSingleHeaderClearance = async (target: Locator) => {
  await target.evaluate(element => {
    element.scrollIntoView({ block: 'start' })
  })
  await expect.poll(() => target.evaluate(element => {
    const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)

    return Math.abs(element.getBoundingClientRect().top - padding)
  })).toBeLessThanOrEqual(1)
}

const expectWholeHeadingWords = async (headings: Locator) => {
  const brokenWords = await headings.evaluateAll(elements => elements.flatMap(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const broken: string[] = []
    const context = document.createElement('canvas').getContext('2d')
    const containerWidth = element.parentElement?.getBoundingClientRect().width
    const style = getComputedStyle(element)

    if (!context || containerWidth === undefined) throw new Error('Expected a measurable heading and its section')
    context.font = style.font
    const letterSpacing = Number.parseFloat(style.letterSpacing) || 0
    let node = walker.nextNode()

    while (node) {
      for (const word of (node.textContent ?? '').matchAll(/[A-Za-z]+/gu)) {
        const range = document.createRange()

        range.setStart(node, word.index)
        range.setEnd(node, word.index + word[0].length)
        // A word wider than the entire column must wrap at extreme text sizes.
        // Decorative rules must not split words that fit the reading column.
        const wordWidth = context.measureText(word[0]).width + letterSpacing * word[0].length

        if (wordWidth <= containerWidth && range.getClientRects().length > 1) broken.push(word[0])
      }
      node = walker.nextNode()
    }
    return broken
  }))

  expect(brokenWords).toEqual([])
}

const cases = [
  {
    route: '/portfolio/lumen-ui/',
    targets: '[data-project-context-lead] h2, [data-project-section-heading] h3, [data-project-evidence-brief]'
  },
  {
    route: '/portfolio/smith-commerce/',
    targets: '[data-project-context-lead] h2, [data-client-masthead] h2, [data-project-section-heading] h3, [data-technical-header] h3, [data-project-synthesis] h2'
  }
]

const settleReadingLayout = async (page: Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        resolve()
      }))
    })
  })
}

for (const theme of ['light', 'dark'] as const) {
  for (const { width, textSize } of [
    { width: 320, textSize: 100 },
    { width: 320, textSize: 200 },
    { width: 375, textSize: 100 },
    { width: 390, textSize: 200 },
    { width: 1440, textSize: 100 },
    { width: 1440, textSize: 200 }
  ]) {
    for (const { route, targets } of cases) {
      test(`project fragments keep one header clearance on ${route} at ${width}px with ${textSize}% text in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        await page.goto(route)
        await page.evaluate(size => {
          document.documentElement.style.fontSize = `${size}%`
        }, textSize)
        await settleReadingLayout(page)

        const sections = page.locator(targets)

        expect(await sections.count()).toBeGreaterThan(3)
        for (const section of await sections.all()) {
          await expectSingleHeaderClearance(section)
        }
        await expectWholeHeadingWords(page.locator('[data-project-section-heading] h3'))
      })
    }
  }
}
