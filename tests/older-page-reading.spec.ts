import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const openPage = async (page: Page, route: string, textSize: number) => {
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

const expectWordsToFit = async (copy: Locator) => {
  const broken = await copy.evaluateAll(elements => elements.flatMap(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const words: string[] = []
    let node = walker.nextNode()

    while (node) {
      for (const match of (node.textContent ?? '').matchAll(/[A-Za-z]+/gu)) {
        const range = document.createRange()

        range.setStart(node, match.index)
        range.setEnd(node, match.index + match[0].length)
        const lines = new Set([...range.getClientRects()]
          .filter(rect => rect.width > 0).map(rect => Math.round(rect.y)))

        if (lines.size > 1) words.push(match[0])
      }
      node = walker.nextNode()
    }
    return words
  }))

  expect(broken, 'Ordinary words need a readable column instead of splitting inside the control').toEqual([])
}

const expectContentInside = async (container: Locator) => {
  const outside = await container.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const clipped: string[] = []
    let node = walker.nextNode()

    while (node) {
      if (node.textContent?.trim() && node.parentElement?.checkVisibility()) {
        const range = document.createRange()

        range.selectNodeContents(node)
        if ([...range.getClientRects()].some(rect => rect.width > 0 && (
          rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1
        ))) clipped.push(node.textContent.trim())
      }
      node = walker.nextNode()
    }
    return clipped
  })

  expect(outside).toEqual([])
}

const expectReadingWords = async (copy: Locator, width: number) => {
  // Long prose words may need a break at 320px with 200% text; their full text
  // must still stay inside the card. Wider columns should keep these words whole.
  if (width >= 390) await expectWordsToFit(copy)
}

const expectVisibleFocusIndicator = async (surface: Locator) => {
  await expect(surface).toHaveCSS('outline-style', 'solid')
  const focusVisible = await surface.evaluate(element => {
    const style = getComputedStyle(element)
    const width = Number.parseFloat(style.outlineWidth)
    const extent = width + Number.parseFloat(style.outlineOffset)
    const bounds = element.getBoundingClientRect()
    let parent = element.parentElement

    if (width < 2 || style.outlineColor === 'rgba(0, 0, 0, 0)') return false
    while (parent) {
      const parentStyle = getComputedStyle(parent)
      const box = parent.getBoundingClientRect()

      if (['hidden', 'clip', 'auto', 'scroll'].includes(parentStyle.overflowX) && (
        bounds.left - extent < box.left || bounds.right + extent > box.right
      )) return false
      if (['hidden', 'clip', 'auto', 'scroll'].includes(parentStyle.overflowY) && (
        bounds.top - extent < box.top || bounds.bottom + extent > box.bottom
      )) return false
      parent = parent.parentElement
    }
    return true
  })

  expect(focusVisible, 'Every edge of the keyboard indicator must remain visible').toBe(true)
}

const linkDestination = async (link: Locator) => {
  const href = await link.getAttribute('href')

  if (!href) throw new Error('Article cards must link to an article')
  return href
}

for (const width of [320, 390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Older reading components at ${width}px and ${textSize}% in ${theme}`, () => {
        test.use({ viewport: { width, height: width < 500 ? 844 : 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('project stack disclosure keeps its label and focus readable', async ({ page }) => {
          await openPage(page, '/portfolio/lumen-ui/', textSize)
          const stack = page.locator('section[aria-labelledby="sidebar-stack"]')
          const trigger = stack.locator('summary')
          const extra = stack.locator('[data-site-pill-label]').filter({ hasText: /^Accessibility$/ })

          await expect(extra).toBeHidden()
          await page.keyboard.press('Tab')
          await trigger.focus()
          await expect(trigger).toBeFocused()
          await expect(trigger).toBeInViewport({ ratio: 1 })
          await expectWordsToFit(trigger)
          await page.keyboard.press('Enter')
          await expect(stack.locator('details')).toHaveAttribute('open', '')
          await expect(extra).toBeVisible()
          await expect(trigger).toBeFocused()
          await expectReadingWords(stack.locator('[data-site-pill-label]'), width)
          await expectContentInside(stack)
          await expectVisibleFocusIndicator(trigger)
          await page.keyboard.press('Space')
          await expect(extra).toBeHidden()
          await expect(trigger).toBeFocused()
        })

        test('case study summaries and article topics retain reading space', async ({ page }) => {
          await openPage(page, '/portfolio/auth/', textSize)
          const summary = page.getByRole('region', { name: 'Case study summary' })

          await expectContentInside(summary)
          await expectReadingWords(summary, width)
          await page.goto('/developer-experience/')
          await page.evaluate(() => document.fonts.ready)
          const card = page.locator('[data-post-gallery-card]').first()

          await expectContentInside(card)
          await expectReadingWords(card.locator('h3, [data-site-pill-label]'), width)
          await page.keyboard.press('Tab')
          const link = card.locator(':scope > a')

          await link.focus()
          await expect(link).toBeFocused()
          await expectVisibleFocusIndicator(link)
          await expect(card).toHaveCSS('outline-style', 'none')
          const destination = await linkDestination(link)
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(new RegExp(`${destination}$`, 'u'))
          await expect(page.getByRole('heading', { level: 1 })).toContainText('Developer Experience')
        })

        test('Work timeline markers leave clear space around the role labels', async ({ page }) => {
          await openPage(page, '/work/', textSize)
          const separated = await page.locator('[data-timeline-row]').evaluateAll(rows => rows.every(row => {
            const marker = row.querySelector('[data-career-icon]')?.getBoundingClientRect()
            const role = row.querySelector('[data-career-role]')?.getBoundingClientRect()
            const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)

            if (!marker || !role) return false
            return role.left - marker.right >= 0.75 * rem || role.top - marker.bottom >= 0.5 * rem
          }))

          expect(separated).toBe(true)
        })
      })
    }
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`expanded project stack passes accessibility checks in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await openPage(page, '/portfolio/lumen-ui/', 200)
    const trigger = page.locator('section[aria-labelledby="sidebar-stack"] summary')

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('section[aria-labelledby="sidebar-stack"] details')).toHaveAttribute('open', '')
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
