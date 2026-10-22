import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('404 page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/this-page-does-not-exist/', { waitUntil: 'domcontentloaded' })
  })

  test('should return a 404 status code', async ({ request }) => {
    const response = await request.get('/this-page-does-not-exist/')
    expect(response.status()).toBe(404)
  })

  test('should show the 404 heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('orbit')
  })

  test('should expose the error section through its heading', async ({ page }) => {
    const errorSection = page.locator('section[aria-labelledby="error-heading"]')

    await expect(errorSection).toBeVisible()
    await expect(errorSection.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'error-heading')
  })

  test('should provide navigation links back to key pages', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /Back home/i })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('href', /^\/$/)

    const portfolioLink = page.getByRole('link', { name: 'Portfolio' })
    await expect(portfolioLink.first()).toBeVisible()

    const blogLink = page.getByRole('link', { name: 'Blog' })
    await expect(blogLink.first()).toBeVisible()
  })

  test('content stays still without a reduced-motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.reload()
    const illustration = page.locator('main svg[viewBox="0 0 220 220"]')

    await expect(illustration).toBeVisible()
    const loops = await page.locator('main').evaluate(element => element.getAnimations({ subtree: true })
      .filter(animation => animation.effect?.getTiming().iterations === Infinity).length)

    expect(loops).toBe(0)
  })

  test('recovery descriptions activate their named destination links', async ({ page }) => {
    for (const [title, path] of [['Portfolio', '/portfolio/'], ['Blog', '/blog/'], ['About', '/about/']] as const) {
      await page.goto('/this-page-does-not-exist/')
      const suggestions = page.getByRole('navigation', { name: 'Try these instead', exact: true })
      const link = suggestions.getByRole('link', { name: new RegExp(`^${title} `, 'u') })
      await expect(link).toHaveAttribute('href', path)
      await link.locator('p').click()
      await expect(page).toHaveURL(path)
    }
  })

  test('recovery copy keeps whole words at 320px with enlarged text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await page.evaluate(() => document.fonts.ready)
    const suggestions = page.getByRole('navigation', { name: 'Try these instead', exact: true })
    const brokenWords = await suggestions.evaluate(element => {
      const broken: string[] = []
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
          const range = document.createRange()
          range.setStart(node, match.index)
          range.setEnd(node, match.index + match[0].length)
          if (range.getClientRects().length > 1) broken.push(match[0])
        }
      }
      return broken
    })
    expect(brokenWords).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('not-found-page.png')
    })
  }
})
