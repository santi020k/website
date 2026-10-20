import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const article = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'

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
}

const expectControlsFit = async (controls: Locator) => {
  expect(await controls.count()).toBeGreaterThan(0)
  const outside = await controls.evaluateAll(elements => elements.flatMap(element => {
    const rect = element.getBoundingClientRect()
    const parent = element.parentElement?.getBoundingClientRect()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const errors: string[] = []
    let node = walker.nextNode()

    if (!parent) throw new Error('Expected control parent')
    if (rect.x < parent.x - 1 || rect.right > parent.right + 1 ||
      rect.x < 0 || rect.right > document.documentElement.clientWidth + 1) {
      errors.push(`Control leaves its container: ${element.textContent}`)
    }
    while (node) {
      if (node.textContent?.trim() && !node.parentElement?.closest('.sr-only')) {
        const range = document.createRange()

        range.selectNodeContents(node)
        for (const text of range.getClientRects()) {
          if (text.width > 0 && (text.x < rect.x - 1 || text.right > rect.right + 1)) {
            errors.push(`Label leaves its control: ${node.textContent}`)
          }
        }
      }
      node = walker.nextNode()
    }
    return errors
  }))

  expect(outside).toEqual([])
}

for (const width of [320, 390, 768, 1024, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Reading controls ${width}px / ${textSize}% / ${theme}`, () => {
        test.use({ viewport: { width, height: 844 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('project actions fit their controls and the related-work shelf', async ({ page }) => {
          await openWithTextSize(page, '/portfolio/lumen-ui/', textSize)
          await expectControlsFit(page.locator('main [data-slot="button-link"]'))
          const browse = page.getByRole('link', { name: 'Browse all projects', exact: true })

          await page.keyboard.press('Tab')
          await browse.focus()
          await expect(browse).toBeFocused()
          await expect(browse).toHaveCSS('outline-style', 'solid')
          await expect(browse).toHaveCSS('outline-width', '2px')
          await browse.press('Enter')
          await expect(page).toHaveURL('/projects/')
        })

        test('article actions fit and the series title has one continuous focus outline', async ({ page }) => {
          await openWithTextSize(page, article, textSize)
          await expectControlsFit(page.locator('main [data-slot="button-link"]'))
          const title = page.locator('[data-series-navigator-title]')

          await page.keyboard.press('Tab')
          await title.focus()
          await expect(title).toBeFocused()
          await expect(title).toHaveCSS('outline-style', 'solid')
          await expect(title).toHaveCSS('outline-width', '2px')
          expect(await title.evaluate(element => element.getClientRects().length)).toBe(1)
          await title.press('Enter')
          await expect(page).toHaveURL('/blog/series/the-santi020k-way/')
        })
      })
    }
  }
}

for (const route of ['/privacy/', '/terms/']) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${route} email is identifiable without color (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await openWithTextSize(page, route, 200)
      await expect(page.locator('main a[href^="mailto:"]')).toHaveCSS('text-decoration-line', 'underline')
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }
}

for (const width of [1024, 1152, 1440]) {
  test(`normal desktop shelf keeps its bottom-aligned action beside the copy at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await openWithTextSize(page, '/portfolio/lumen-ui/', 100)
    const aligned = await page.locator('[data-section-header-shelf]').evaluate(element => {
      const copy = element.firstElementChild
      const action = element.lastElementChild

      if (!copy || !action) throw new Error('Expected shelf copy and action')
      return Math.abs(copy.getBoundingClientRect().bottom - action.getBoundingClientRect().bottom) < 1
    })

    expect(aligned).toBe(true)
  })
}
