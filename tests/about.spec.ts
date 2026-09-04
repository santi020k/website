/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle('Santiago Molina — Engineering Leader | santi020k')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('I’m Santiago Molina.')
  })

  test('should identify Santiago Molina as the profile page main entity', async ({ page }) => {
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents()
    const profileSchema = structuredData.find(schema => schema.includes('"@type":"ProfilePage"'))

    expect(profileSchema).toBeDefined()
    expect(profileSchema).toContain('"name":"Santiago Molina"')
    expect(profileSchema).toContain('"alternateName":"santi020k"')
    expect(profileSchema).toContain('"sameAs"')
  })

  test('should contain key sections', async ({ page }) => {
    await expect(page.locator('#main').getByText('Engineering leader · full-stack architect', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /What I believe about engineering/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /What collaborators say about the work/i })).toBeVisible()
    await expect(page.locator('.ui-note')).toHaveCount(3)
    await expect(page.locator('[data-principle]')).toHaveCount(6)
  })

  test('should have working call-to-action links', async ({ page }) => {
    const portfolioLink = page.getByRole('link', { name: /See selected work/i })
    const blogLink = page.getByRole('link', { name: /Read the blog/i })

    await expect(portfolioLink).toBeVisible()
    await expect(portfolioLink).toHaveAttribute('href', /^\/portfolio\/$/)

    await expect(blogLink).toBeVisible()
    await expect(blogLink).toHaveAttribute('href', /^\/blog\/$/)
  })

  test('should page the organization carousel reversibly without hiding focused links', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 800 })

    const carousel = page.locator('[data-organization-carousel]')
    const items = carousel.locator('[data-carousel-item]')
    const previousButton = carousel.getByRole('button', { name: 'Show previous organizations' })
    const nextButton = carousel.getByRole('button', { name: 'Show next organizations' })

    await expect(items).toHaveCount(9)

    for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) await nextButton.click()

    await expect(items.nth(6)).not.toBeVisible()
    await expect(items.nth(7)).toBeVisible()
    await expect(items.nth(8)).toBeVisible()

    await previousButton.click()

    await expect(items.nth(6)).toBeVisible()
    await expect(items.nth(7)).toBeVisible()
    await expect(items.nth(8)).not.toBeVisible()

    const focusedLink = items.nth(6).getByRole('link')

    await focusedLink.focus()
    await page.keyboard.press('ArrowRight')

    await expect(focusedLink).toBeFocused()
    await expect(items.nth(6)).toBeVisible()
    await expect(items.nth(8)).not.toBeVisible()
  })

  test('should dispose carousel resize work across page transitions', async ({ page }) => {
    const detachedStatus = await page.locator('[data-carousel-status]').evaluateHandle(status => status)

    await page.locator('a[href="/"]').first().click()
    await expect(page).toHaveURL('/')

    await detachedStatus.evaluate(status => {
      status.textContent = 'detached-sentinel'
    })

    await page.setViewportSize({ height: 900, width: 800 })

    expect(await detachedStatus.evaluate(status => status.textContent)).toBe('detached-sentinel')
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('about-page.png')
    })
  }
})
