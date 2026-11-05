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
          // Enhanced galleries hide their fallback anchors and expose dialog buttons.
          await expectControlsFit(page.locator('main [data-slot="button-link"]:visible, main [data-gallery-control]:visible'))
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
          await expectControlsFit(page.locator('main [data-slot="button-link"]:visible'))
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

const expectRelatedWorkLayout = async (page: Page, stacked: boolean) => {
  const layout = await page.locator('[data-section-header-shelf]').evaluate(element => {
    const copy = element.querySelector('[data-chapter-copy]')
    const footer = element.querySelector('[data-chapter-footer]')
    const action = footer?.querySelector('a')

    if (!copy || !footer || !action) throw new Error('Expected chapter copy, footer and action')
    return {
      copyLeft: copy.getBoundingClientRect().left,
      copyRight: copy.getBoundingClientRect().right,
      copyBottom: copy.getBoundingClientRect().bottom,
      footerTop: footer.getBoundingClientRect().top,
      footerLeft: footer.getBoundingClientRect().left,
      footerBottom: footer.getBoundingClientRect().bottom,
      footerRight: footer.getBoundingClientRect().right,
      actionLeft: action.getBoundingClientRect().left,
      actionRight: action.getBoundingClientRect().right
    }
  })

  if (stacked) {
    expect(layout.footerTop).toBeGreaterThan(layout.copyBottom)
    expect(layout.actionLeft).toBeCloseTo(layout.copyLeft, 0)
  } else {
    expect(layout.footerLeft).toBeGreaterThan(layout.copyRight)
    expect(layout.footerBottom).toBeCloseTo(layout.copyBottom, 0)
    expect(layout.actionRight).toBeCloseTo(layout.footerRight, 0)
  }
}

for (const { width, stacked } of [
  { width: 390, stacked: true },
  { width: 1024, stacked: false },
  { width: 1152, stacked: false },
  { width: 1440, stacked: false }
]) {
  test(`related-work header keeps its action beside or below readable copy at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await openWithTextSize(page, '/portfolio/lumen-ui/', 100)
    await expect(page.locator('[data-section-header-shelf]')).toBeVisible()
    await expectRelatedWorkLayout(page, stacked)
  })
}
