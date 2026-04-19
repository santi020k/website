import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

import { expect, test } from '@playwright/test'

test.describe('Speaking page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/speaking/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Speaking/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should contain the key sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Make the invite easy/i, level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /What I like to speak about/i, level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Formats that fit teams/i, level: 2 })).toBeVisible()
  })

  test('should expose the invite CTA with a mailto href', async ({ page }) => {
    const ctaLinks = page.getByRole('link', { name: /Invite me to speak/i })
    await expect(ctaLinks.first()).toBeVisible()
    await expect(ctaLinks.first()).toHaveAttribute('href', /^mailto:/)
  })

  test('should link to LinkedIn', async ({ page }) => {
    const linkedInLink = page.getByRole('link', { name: /Connect on LinkedIn/i })
    await expect(linkedInLink.first()).toBeVisible()
    await expect(linkedInLink.first()).toHaveAttribute('href', /linkedin/)
  })

  test('should render topic cards', async ({ page }) => {
    const topicsSection = page.getByRole('heading', { name: /What I like to speak about/i })
    await expect(topicsSection).toBeVisible()
    // At least one topic article should be visible after the heading
    const topicArticles = page.locator('section').filter({ has: topicsSection }).locator('article')
    await expect(topicArticles.first()).toBeVisible()
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('should match visual snapshot', async ({ page }) => {
    test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)
    await expect(page).toHaveScreenshot('speaking-page.png')
  })
})
