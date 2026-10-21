import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const policies = [
  { route: '/privacy/', count: 5, first: 'What runs here', last: 'Webmentions' },
  { route: '/terms/', count: 8, first: 'Using this site', last: 'Changes and governing law' },
  { route: '/accessibility/', count: 4, first: 'Target standard', last: 'Formal complaints' }
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Evidence rows in ${theme}`, () => {
    test.use({ viewport: { width: 320, height: 844 }, colorScheme: theme, reducedMotion: 'reduce' })

    for (const policy of policies) {
      test(`${policy.route} keeps complete words and accessible sections at 200% text`, async ({ page }) => {
        await page.addInitScript(() => {
          const apply = () => {
            const root = document.querySelector('html')
            if (!root) return false
            root.style.fontSize = '200%'
            return true
          }
          if (!apply()) {
            const observer = new MutationObserver(() => {
              if (apply()) observer.disconnect()
            })
            observer.observe(document, { childList: true })
          }
        })
        await page.goto(policy.route)
        await page.evaluate(() => document.fonts.ready)
        const panel = page.locator('[data-policy-card]')
        const headings = panel.getByRole('heading', { level: 2 })
        await expect(headings).toHaveCount(policy.count)
        await expect(headings.first()).toHaveText(policy.first)
        await expect(headings.last()).toHaveText(policy.last)
        const broken = await panel.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const issues: string[] = []
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          let node = walker.nextNode()
          while (node) {
            for (const match of (node.textContent ?? '').matchAll(/[A-Za-z0-9]+/gu)) {
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
        })
        expect(broken, 'Words remain intact within the reading panel').toEqual([])
        await expectNoUnexpectedAccessibilityViolations(page)
      })
    }
  })
}

test.describe('Policy sections without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const policy of policies) {
    test(`${policy.route} preserves the complete reading order`, async ({ page }) => {
      await page.goto(policy.route)
      const panel = page.locator('[data-policy-card]')
      const headings = panel.getByRole('heading', { level: 2 })
      await expect(headings).toHaveCount(policy.count)
      await expect(headings.first()).toHaveText(policy.first)
      await expect(headings.last()).toHaveText(policy.last)
      await expect(panel.locator('[data-policy-copy]')).toHaveCount(policy.count)
      await expect(headings.last()).toBeVisible()
      await expect(panel.getByRole('link')).toHaveCount(0)
    })
  }
})
