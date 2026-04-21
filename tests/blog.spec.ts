import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

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
    await expectNoUnexpectedAccessibilityViolations(page, [
      {
        htmlIncludes: 'href="https://medium.com',
        id: 'color-contrast'
      }
    ])
  })

  test('index search should return matching content links', async ({ page }) => {
    await page.goto('/blog/')

    await page.getByRole('button', { name: 'Open site search' }).click()
    const input = page.getByPlaceholder('Search by title, tag, or keyword...')
    await input.fill('eslint')

    const results = page.locator('#site-search-results li a')
    await expect(results.first()).toBeVisible()
    await expect(results.first()).toHaveAttribute('href', /\/blog\/|\/portfolio\//)
  })

  test('index should match visual snapshot', async ({ page }) => {
    test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)
    await page.goto('/blog/')
    await expect(page).toHaveScreenshot('blog-index.png')
  })

  test('single post page should load correctly', async ({ page }) => {
    // Navigating to a known post slug
    const slug = 'atomic-module-component-structure-for-react'
    await page.goto(`/blog/${slug}/`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main article').first()).toBeVisible()

    // Post content accessibility audit
    await expectNoUnexpectedAccessibilityViolations(page, [
      {
        htmlIncludes: '<dl class="mt-4 space-y-4 text-sm/6 text-ink-soft">',
        id: 'definition-list'
      },
      {
        id: 'dlitem',
        targetIncludes: '.gap-2.flex.items-center'
      },
      {
        htmlIncludes: '<aside class="editorial-rail">',
        id: 'landmark-complementary-is-top-level'
      }
    ])
  })

  test('single post page should match visual snapshot', async ({ page }) => {
    test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)

    const slug = 'atomic-module-component-structure-for-react'
    await page.goto(`/blog/${slug}/`)
    await expect(page).toHaveScreenshot('blog-post.png')
  })
})
