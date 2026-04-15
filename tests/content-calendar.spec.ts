import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

import { expect, test } from '@playwright/test'

test.describe('Content calendar page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/content-calendar/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Content Calendar/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display the publishing stats panel', async ({ page }) => {
    await expect(page.getByText('New posts')).toBeVisible()
    await expect(page.getByText('Refreshes')).toBeVisible()
    await expect(page.getByText('Series')).toBeVisible()
  })

  test('should render roadmap entry articles', async ({ page }) => {
    const roadmapSection = page.getByRole('heading', { name: /What is scheduled/i })
    await expect(roadmapSection).toBeVisible()
    const articles = page.locator('section').filter({ has: roadmapSection }).locator('article')
    await expect(articles.first()).toBeVisible()
  })

  test('should link to RSS feed', async ({ page }) => {
    const rssLink = page.getByRole('link', { name: /Follow via RSS/i })
    await expect(rssLink.first()).toBeVisible()
    await expect(rssLink.first()).toHaveAttribute('href', '/feed.xml')
  })

  test('should link back to the blog index', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to blog/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/blog/')
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expectNoUnexpectedAccessibilityViolations(page)
  })
})
