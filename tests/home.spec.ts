import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

import { expect, test } from '@playwright/test'

test('homepage has correct title and main sections', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/santi|Santi/)

  const mainMenu = page.getByRole('navigation', { name: 'Main menu' })

  await expect(mainMenu).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Portfolio' })).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Blog' })).toBeVisible()

  // Accessibility audit
  await expectNoUnexpectedAccessibilityViolations(page, [
    {
      htmlIncludes: 'href="/portfolio/"',
      id: 'color-contrast'
    }
  ])
})

test('homepage exposes shared accessibility affordances', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  await expect(page.getByRole('switch', { name: 'Toggle color theme' })).toBeVisible()
})

test('mobile navigation button keeps aria state in sync', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menuToggle = page.getByRole('button', { name: 'Open navigation' })

  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  await menuToggle.click()
  await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveAttribute('aria-expanded', 'true')
})

test('homepage should match visual snapshot', async ({ page }) => {
  test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)

  await page.goto('/')
  await expect(page).toHaveScreenshot('home-page.png')
})

test('navigation to portfolio works', async ({ page }) => {
  await page.goto('/')

  const mainMenu = page.getByRole('navigation', { name: 'Main menu' })
  const portfolioLink = mainMenu.getByRole('link', { name: 'Portfolio' })

  await portfolioLink.click()

  await expect(page).toHaveURL(/\/portfolio\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Case studies from real teams/i })).toBeVisible()
})

test('navigation to blog works', async ({ page }) => {
  await page.goto('/')

  const mainMenu = page.getByRole('navigation', { name: 'Main menu' })
  const blogLink = mainMenu.getByRole('link', { name: 'Blog' })

  await blogLink.click()

  await expect(page).toHaveURL(/\/blog\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Writing about software architecture/i })).toBeVisible()
})
