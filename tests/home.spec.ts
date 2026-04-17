import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

import { expect, test } from '@playwright/test'

test('homepage has correct title and main sections', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/santi|Santi/)

  const viewport = page.viewportSize()
  const isMobile = viewport !== null && viewport.width < 1024

  if (isMobile) {
    // On mobile the desktop nav is hidden; verify the hamburger toggle is present
    await expect(page.locator('[data-mobile-nav-toggle]')).toBeVisible()
  } else {
    const mainMenu = page.getByRole('navigation', { name: 'Main menu' }).first()

    await expect(mainMenu).toBeVisible()
    await expect(mainMenu.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mainMenu.getByRole('link', { name: 'Portfolio' })).toBeVisible()
    await expect(mainMenu.getByRole('link', { name: 'Blog' })).toBeVisible()
  }

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

test('mobile navigation can open and close cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menuToggle = page.locator('[data-mobile-nav-toggle]')
  const mobileNav = page.locator('#mobile-nav')

  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(mobileNav).not.toBeVisible()

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(mobileNav).toBeVisible()

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(mobileNav).not.toBeVisible()
})

test('mobile navigation resets after navigating to another page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menuToggle = page.locator('[data-mobile-nav-toggle]')

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')

  await page.locator('#mobile-nav').getByRole('link', { name: 'About' }).click()

  await expect(page).toHaveURL(/\/about\/$/)
  await expect(page.locator('[data-mobile-nav-toggle]')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#mobile-nav')).not.toBeVisible()
})

test('homepage should match visual snapshot', async ({ page }) => {
  test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)

  await page.goto('/')
  await expect(page).toHaveScreenshot('home-page.png')
})

test('navigation to portfolio works', async ({ page }) => {
  await page.goto('/')

  const viewport = page.viewportSize()
  const isMobile = viewport !== null && viewport.width < 1024

  if (isMobile) {
    await page.locator('[data-mobile-nav-toggle]').click()
    await page.locator('#mobile-nav').getByRole('link', { name: 'Portfolio' }).click()
  } else {
    await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'Portfolio' }).click()
  }

  await expect(page).toHaveURL(/\/portfolio\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Case studies from real teams/i })).toBeVisible()
})

test('navigation to blog works', async ({ page }) => {
  await page.goto('/')

  const viewport = page.viewportSize()
  const isMobile = viewport !== null && viewport.width < 1024

  if (isMobile) {
    await page.locator('[data-mobile-nav-toggle]').click()
    await page.locator('#mobile-nav').getByRole('link', { name: 'Blog' }).click()
  } else {
    await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'Blog' }).click()
  }

  await expect(page).toHaveURL(/\/blog\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Writing about software architecture/i })).toBeVisible()
})
