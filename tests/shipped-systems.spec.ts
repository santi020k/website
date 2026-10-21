import { expect, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const systems = [
  { title: 'Astro Doctor', label: 'Explore Astro Doctor', href: '/portfolio/astro-doctor/' },
  { title: 'ESLint Config Basic', label: 'Explore the ESLint toolkit', href: '/portfolio/eslint-config-basic/' },
  { title: 'Lumen UI', label: 'Explore Lumen UI', href: '/portfolio/lumen-ui/' }
]

const openWithTextSize = async (page: Page, textSize: number) => {
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
  await page.goto('/developer-experience/#shipped-systems')
  await page.evaluate(() => document.fonts.ready)
}

for (const width of [320, 390, 1024, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`System folio at ${width}px, ${textSize}% text, ${theme}`, () => {
        test.use({ viewport: { width, height: 844 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('keeps complete copy and keyboard navigation', async ({ page, browserName }) => {
          await openWithTextSize(page, textSize)
          const cards = page.locator('[data-shipped-system]')
          const links = cards.getByRole('link')

          await expect(cards).toHaveCount(3)
          await expect(links).toHaveCount(3)
          await expect(cards.getByRole('heading', { level: 3 })).toHaveText(systems.map(system => system.title))
          for (const system of systems) {
            await expect(links.getByText(system.label, { exact: true })).toBeVisible()
            await expect(cards.getByRole('link', { name: system.label, exact: true })).toHaveAttribute('href', system.href)
          }

          const failures = await cards.evaluateAll(elements => elements.flatMap(element => {
            const bounds = element.getBoundingClientRect()
            const issues: string[] = []
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
            let node = walker.nextNode()

            while (node) {
              if (node.parentElement?.checkVisibility()) {
                for (const match of (node.textContent ?? '').matchAll(/[A-Za-z0-9]+/gu)) {
                  const range = document.createRange()
                  range.setStart(node, match.index)
                  range.setEnd(node, match.index + match[0].length)
                  const boxes = [...range.getClientRects()].filter(rect => rect.width > 0)
                  const lines = new Set(boxes.map(rect => Math.round(rect.y)))
                  if (lines.size > 1 || boxes.some(rect => (
                    rect.left < Math.max(bounds.left, 0) - 1 || rect.right > Math.min(bounds.right, innerWidth) + 1 ||
                    rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1
                  ))) issues.push(match[0])
                }
              }
              node = walker.nextNode()
            }
            return issues
          }))
          expect(failures, 'Words must remain complete and inside their cards').toEqual([])

          await links.nth(0).focus()
          for (const index of [1, 2]) {
            await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
            await expect(links.nth(index)).toBeFocused()
          }
          const outline = await links.nth(2).evaluate(element => {
            const style = getComputedStyle(element)
            return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle }
          })
          expect(outline.width).toBeGreaterThanOrEqual(2)
          expect(outline.style).toBe('solid')
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(/\/portfolio\/lumen-ui\/$/u)
        })
      })
    }
  }
}

test('aligns neighboring card headers and action dividers on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openWithTextSize(page, 100)
  const cards = page.locator('[data-shipped-system]')
  const headerBottoms = await cards.locator('[data-system-heading]').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().bottom)))
  const footerTops = await cards.locator('[data-system-footer]').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)))
  expect(new Set(headerBottoms).size, 'Neighboring headers share a baseline').toBe(1)
  expect(new Set(footerTops).size, 'Neighboring action dividers share a baseline').toBe(1)
})

for (const theme of ['light', 'dark'] as const) {
  test(`System folio page passes accessibility checks with enlarged text in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await openWithTextSize(page, 200)
    await expect(page.locator('[data-shipped-system]')).toHaveCount(3)
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test.describe('System folio without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('retains every case-study destination', async ({ page }) => {
    for (const system of systems) {
      await page.goto('/developer-experience/#shipped-systems')
      const link = page.locator('[data-shipped-system]').getByRole('link', { name: system.label, exact: true })
      await link.press('Enter')
      await expect(page).toHaveURL(new RegExp(`${system.href}$`, 'u'))
    }
  })
})
