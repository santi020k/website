import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const tabKeys = {
  chromium: { next: 'Tab', previous: 'Shift+Tab' },
  firefox: { next: 'Tab', previous: 'Shift+Tab' },
  webkit: { next: 'Alt+Tab', previous: 'Alt+Shift+Tab' }
}

for (const theme of ['light', 'dark'] as const) {
  test(`About exploration stays readable with enlarged text in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/about/')

    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)

        const invitation = page.getByRole('region', { name: 'Want the fuller picture?' })
        const links = invitation.getByRole('link')

        await expect(links).toHaveCount(2)
        await expect(links.nth(0)).toHaveAccessibleName('Project evidence View portfolio')
        await expect(links.nth(1)).toHaveAccessibleName('Thinking behind the decisions Read the blog')
        const clipped = await invitation.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          const outside: string[] = []
          let node = walker.nextNode()

          while (node) {
            if (node.textContent?.trim()) {
              const range = document.createRange()

              range.selectNodeContents(node)
              if ([...range.getClientRects()].some(rect => rect.width > 0 && (
                rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
              ))) outside.push(node.textContent.trim())
            }
            node = walker.nextNode()
          }
          return outside
        })

        expect(clipped, `Invitation copy at ${width}px and ${size}% must fit`).toEqual([])
        for (const link of await links.all()) {
          const geometry = await link.evaluate(element => ({
            height: element.getBoundingClientRect().height,
            client: element.clientWidth,
            scroll: element.scrollWidth
          }))

          expect(geometry.height).toBeGreaterThanOrEqual(44)
          expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1)
        }
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test(`About exploration links support keyboard navigation in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/about/#about-explore')
    const navigation = page.getByRole('navigation', { name: 'Continue exploring' })
    const portfolio = navigation.getByRole('link', { name: /View portfolio/u })
    const blog = navigation.getByRole('link', { name: /Read the blog/u })
    const keys = tabKeys[browserName]

    await portfolio.focus()
    await page.keyboard.press(keys.next)
    await expect(blog).toBeFocused()
    await page.keyboard.press(keys.previous)
    await expect(portfolio).toBeFocused()
    for (const [link, destination] of [[portfolio, '/portfolio/'], [blog, '/blog/']] as const) {
      await link.focus()
      await expect(link).toBeInViewport({ ratio: 1 })
      const outline = await link.evaluate(element => {
        const style = getComputedStyle(element)

        return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle }
      })

      expect(outline.width).toBeGreaterThanOrEqual(2)
      expect(outline.style).toBe('solid')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(destination)
      await page.goBack()
      await expect(page.getByRole('heading', { name: 'Want the fuller picture?' })).toBeVisible()
    }
  })
}
