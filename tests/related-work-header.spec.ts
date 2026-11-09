import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const tabKeys = {
  chromium: { next: 'Tab', previous: 'Shift+Tab' },
  firefox: { next: 'Tab', previous: 'Shift+Tab' },
  webkit: { next: 'Alt+Tab', previous: 'Alt+Shift+Tab' }
}

const headers = [
  { route: '/portfolio/smith-commerce/', title: 'More work in a similar lane.', action: 'Browse all work', href: '/work/' },
  { route: '/portfolio/lumen-ui/', title: 'More projects in a similar lane.', action: 'Browse all projects', href: '/projects/' }
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Related-work heading in ${theme}`, () => {
    test.use({ viewport: { width: 320, height: 844 }, colorScheme: theme, reducedMotion: 'reduce' })
    for (const header of headers) {
      // Default sizing exercises the normal-text contrast threshold.
      test(`${header.route} keeps normal-size chapter emphasis readable`, async ({ page }) => {
        await page.goto(header.route)
        await expect(page.locator('html')).toHaveAttribute('data-theme', `santi020k-${theme}`)
        const tab = page.getByRole('region', { name: header.title }).locator('[data-chapter-tab]')
        await expect(tab).toHaveText('Related work')
        await expect(tab).toHaveCSS('font-size', '11px')
        await expectNoUnexpectedAccessibilityViolations(page)
      })

      test(`${header.route} preserves readable copy and keyboard navigation at 200% text`, async ({ page, browserName }) => {
        await page.goto(header.route)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%'
        })
        await page.evaluate(() => document.fonts.ready)
        const panel = page.getByRole('region', { name: header.title })
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText(header.title)
        await expect(panel.locator('[data-chapter-tab]')).toHaveText('Related work')
        const browse = panel.getByRole('link', { name: header.action, exact: true })
        await expect(browse).toHaveAttribute('href', header.href)
        await browse.focus()
        await page.keyboard.press(tabKeys[browserName].next)
        await page.keyboard.press(tabKeys[browserName].previous)
        await expect(browse).toBeFocused()
        expect(await browse.evaluate(element => {
          const style = getComputedStyle(element)
          return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0
        })).toBe(true)
        expect(await panel.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const issues: string[] = []
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          let node = walker.nextNode()
          while (node) {
            for (const match of (node.textContent ?? '').matchAll(/[A-Za-z0-9@.]+/gu)) {
              const range = document.createRange()
              range.setStart(node, match.index)
              range.setEnd(node, match.index + match[0].length)
              const boxes = [...range.getClientRects()].filter(rect => rect.width > 0)
              if (new Set(boxes.map(rect => Math.round(rect.y))).size > 1 || boxes.some(rect => (
                rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1
              ))) issues.push(match[0])
            }
            node = walker.nextNode()
          }
          return issues
        })).toEqual([])
        await expectNoUnexpectedAccessibilityViolations(page)
      })
    }
  })
}

test.describe('Related-work heading without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const header of headers) {
    test(`${header.route} keeps its browse destination usable`, async ({ page }) => {
      await page.goto(header.route)
      const panel = page.getByRole('region', { name: header.title })
      await expect(panel.getByRole('link', { name: header.action, exact: true })).toHaveAttribute('href', header.href)
      await panel.getByRole('link', { name: header.action, exact: true }).press('Enter')
      await expect(page).toHaveURL(header.href)
    })
  }
})
