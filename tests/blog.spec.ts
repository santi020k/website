/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Blog page', () => {
  test('index should have the correct title and list posts', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page).toHaveTitle(/Blog/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Ensure at least one blog post is listed
    const postLinks = page.locator('article a')
    await expect(postLinks.first()).toBeVisible()
  })

  test('personal topics lead to their posts and preserve navigation back to the mixed feed', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page).toHaveTitle(/Personal Blog/)

    const filter = page.getByRole('group', { name: 'Filter by topic' })
    await filter.getByRole('link', { name: /reading/i }).click()
    await expect(page).toHaveURL(/\/blog\/tags\/reading\//)
    await expect(page.locator('[data-post-gallery-card]')).toContainText('International Firmware')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Articles, guides, and personal notes tagged reading\./)

    await filter.getByRole('link', { name: /gaming/i }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/gaming\//)
    await expect(page.locator('[data-post-gallery-card]')).toContainText('R.E.P.O.')

    await filter.getByRole('link', { name: 'All posts' }).click()
    await expect(page).toHaveURL(/\/blog\/$/)
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)
  })

  test('renders twelve visual posts consistently on every full archive page', async ({ page }) => {
    await page.goto('/blog/')

    await expect(page.locator('[data-post-gallery-featured]')).toHaveCount(0)
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)

    await page.goto('/blog/2/')

    await expect(page.locator('[data-post-gallery-featured]')).toHaveCount(0)
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)
  })

  test('topic and series archives reuse the visual post gallery', async ({ page }) => {
    await page.goto('/blog/tags/developer-experience/')

    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)
    await expect(page.locator('[data-post-card]')).toHaveCount(0)

    await page.goto('/blog/series/the-santi020k-way/')

    await expect(page.locator('[data-post-gallery-card]').first()).toBeVisible()
    await expect(page.locator('[data-post-gallery-card]').first()).toContainText('Part 1')
    await expect(page.locator('[data-post-card]')).toHaveCount(0)
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('index search should return matching content links', async ({ page }) => {
    await page.goto('/blog/')

    await page.getByRole('button', { name: 'Open site search' }).click()
    const input = page.getByPlaceholder('Search by title, tag, or keyword…')
    await input.fill('eslint')

    const results = page.locator('#site-search-results li a')
    await expect(results.first()).toBeVisible()
    await expect(results.first()).toHaveAttribute('href', /\/blog\/|\/portfolio\//)
  })

  if (shouldRunVisualSnapshots) {
    test('index should match visual snapshot', async ({ page }) => {
      await page.goto('/blog/')
      await expect(page).toHaveScreenshot('blog-index.png')
    })
  }

  test('single post page should load correctly', async ({ page }) => {
    // Navigating to a known post slug
    const slug = 'atomic-module-component-structure-for-react'
    await page.goto(`/blog/${slug}/`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main article').first()).toBeVisible()

    // Post content accessibility audit
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page, [
      {
        id: 'duplicate-img-label'
      },
      {
        id: 'images-have-alt'
      }
    ])
  })

  if (shouldRunVisualSnapshots) {
    test('single post page should match visual snapshot', async ({ page }) => {
      const slug = 'atomic-module-component-structure-for-react'
      await page.goto(`/blog/${slug}/`)
      await expect(page).toHaveScreenshot('blog-post.png')
    })
  }
})
