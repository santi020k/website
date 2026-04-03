import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

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

  test('index should match visual snapshot', async ({ page }) => {
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

    // Post visual snapshot
    await expect(page).toHaveScreenshot('blog-post.png')
  })
})
