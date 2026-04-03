import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/About Santiago Molina/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should contain key sections', async ({ page }) => {
    await expect(page.getByText(/Engineering Leader/i)).toBeVisible()
    await expect(page.getByText(/Principles/i)).toBeVisible()
    await expect(page.getByText(/What I believe about engineering/i)).toBeVisible()
  })

  test('should have working call-to-action links', async ({ page }) => {
    const portfolioLink = page.getByRole('link', { name: /See selected work/i })
    const blogLink = page.getByRole('link', { name: /Read the blog/i })

    await expect(portfolioLink).toBeVisible()
    await expect(portfolioLink).toHaveAttribute('href', '/portfolio/')

    await expect(blogLink).toBeVisible()
    await expect(blogLink).toHaveAttribute('href', '/blog/')
  })

  test('should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should match visual snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('about-page.png')
  })
})
