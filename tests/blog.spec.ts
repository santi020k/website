import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('Blog page', () => {
  test('index should have the correct title and list posts', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page).toHaveTitle(/Blog/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Ensure at least one blog post is listed
    const postLinks = page.locator('article a')
    await expect(postLinks.first()).toBeVisible()
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/blog/')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Blog Index A11y Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
    }
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('index should match visual snapshot', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page).toHaveScreenshot('blog-index.png')
  })

  test('single post page should load correctly', async ({ page }) => {
    // Navigating to a known post slug
    const slug = 'atomic-module-component-structure-for-react'
    await page.goto(`/blog/${slug}/`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('article')).toBeVisible()

    // Post content accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Blog Post A11y Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
    }
    expect(accessibilityScanResults.violations).toEqual([])

    // Post visual snapshot
    await expect(page).toHaveScreenshot('blog-post.png')
  })
})
