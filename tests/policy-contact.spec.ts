import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const tabKeys = {
  chromium: { next: 'Tab', previous: 'Shift+Tab' },
  firefox: { next: 'Tab', previous: 'Shift+Tab' },
  webkit: { next: 'Alt+Tab', previous: 'Alt+Shift+Tab' }
}

const invitations = [
  { route: '/privacy/', title: 'Privacy questions should be easy to ask.', subject: '', note: 'Last reviewed October 23, 2026. I aim to acknowledge privacy and deletion requests within five business days.' },
  { route: '/accessibility/', title: 'If something blocks you, send the exact page and task.', subject: '?subject=Accessibility%20issue%20on%20santi020k.com', note: 'Last reviewed July 26, 2026. I aim to acknowledge reports within five business days and share a resolution timeline once the barrier is reproduced.' },
  { route: '/terms/', title: 'Ask before reusing substantial material.', subject: '?subject=Terms%20and%20permissions', note: 'Effective August 25, 2026. Last reviewed August 25, 2026.' }
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Contact folio in ${theme}`, () => {
    test.use({ viewport: { width: 320, height: 844 }, colorScheme: theme, reducedMotion: 'reduce' })
    for (const invitation of invitations) {
      test(`${invitation.route} preserves readable copy and keyboard contact at 200% text`, async ({ page, browserName }) => {
        await page.goto(invitation.route)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%'
        })
        await page.evaluate(() => document.fonts.ready)
        const panel = page.getByRole('region', { name: invitation.title })
        await expect(panel.getByRole('heading', { level: 2 })).toHaveText(invitation.title)
        await expect(panel.locator('[data-policy-contact-note]')).toHaveText(invitation.note)
        const contact = panel.getByRole('link', { name: 'hi@santi020k.com', exact: true })
        await expect(contact).toHaveAttribute('href', `mailto:hi@santi020k.com${invitation.subject}`)
        await contact.focus()
        await page.keyboard.press(tabKeys[browserName].next)
        await page.keyboard.press(tabKeys[browserName].previous)
        await expect(contact).toBeFocused()
        expect(await contact.evaluate(element => {
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

test.describe('Contact folio without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const invitation of invitations) {
    test(`${invitation.route} retains its native contact and review note`, async ({ page }) => {
      await page.goto(invitation.route)
      const panel = page.getByRole('region', { name: invitation.title })
      await expect(panel.getByRole('link', { name: 'hi@santi020k.com', exact: true })).toHaveAttribute('href', `mailto:hi@santi020k.com${invitation.subject}`)
      await expect(panel.locator('[data-policy-contact-note]')).toHaveText(invitation.note)
    })
  }
})
