import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

import { expect, type Page, test } from '@playwright/test'

const navigateFromMobileMenu = async (
  page: Page,
  options: {
    linkName: string
    urlPattern: RegExp
  }
) => {
  const menuToggle = page.locator('[data-mobile-nav-toggle]')
  const menuLink = page.locator('#mobile-nav').getByRole('link', { name: options.linkName })

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(menuLink).toBeVisible()

  await Promise.all([
    page.waitForURL(options.urlPattern),
    menuLink.click()
  ])
}

test('homepage has correct title and main sections', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  await expect(page).toHaveTitle(/santi|Santi/)

  const mainMenu = page.getByRole('navigation', { name: 'Main menu' }).first()

  await expect(mainMenu).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'About' })).toBeVisible()
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
  await expect(page.getByRole('button', { name: 'Open site search' })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Toggle color theme' })).toBeVisible()
  await expect(
    page.locator('header').getByRole('link', { name: /Santiago Molina/i }).first()
  ).toHaveAttribute('href', '/')
})

test('keyboard / opens site search dialog', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible()
  await expect(page.getByPlaceholder('Search by title, tag, or keyword…')).toBeFocused()
})

test('query param opens search with prefilled query and clears on close', async ({ page }) => {
  await page.goto('/?q=eslint')

  const dialog = page.getByRole('dialog', { name: 'Search' })
  const searchInput = page.locator('#site-search-input')
  const searchResults = page.locator('#site-search-results li a')

  await expect(dialog).toBeVisible()
  await expect(searchInput).toHaveValue('eslint')
  await expect(searchResults.first()).toBeVisible()

  await page.getByRole('button', { name: 'Close search' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL('/')
})

test('keyboard navigation opens selected search result', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('/')

  const dialog = page.getByRole('dialog', { name: 'Search' })
  const searchInput = page.locator('#site-search-input')
  const firstResult = page.locator('#site-search-results li a').first()

  await expect(dialog).toBeVisible()
  await expect(searchInput).toBeFocused()

  await searchInput.fill('eslint')
  await expect(firstResult).toBeVisible()

  await page.keyboard.press('ArrowDown')
  const activeResult = page.locator('#site-search-results a[data-site-search-active="true"]').first()
  await expect(activeResult).toBeVisible()

  const expectedPath = await activeResult.evaluate(node => {
    if (!(node instanceof HTMLAnchorElement)) return '/'
    return new URL(node.href).pathname
  })
  expect(expectedPath).toBeTruthy()

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(url => url.pathname === expectedPath)
})

test('homepage project ctas keep accessible names aligned with their visible labels', async ({ page }) => {
  await page.goto('/')

  const projectCtas = page.locator('a').filter({ hasText: 'View project' })
  const projectCtaCount = await projectCtas.count()

  expect(projectCtaCount).toBeGreaterThan(0)

  for (let index = 0; index < projectCtaCount; index += 1) {
    await expect(projectCtas.nth(index)).toHaveAccessibleName(/View project about /i)
  }
})

test('mobile navigation toggle keeps its accessible name aligned with its visible label', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menuToggle = page.locator('[data-mobile-nav-toggle]')

  await expect(menuToggle).toHaveAccessibleName('Menu navigation')

  await menuToggle.click()

  await expect(menuToggle).toHaveAccessibleName('Close navigation')
})

test('mobile navigation can open and close cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menuToggle = page.locator('[data-mobile-nav-toggle]')
  const mobileNav = page.locator('#mobile-nav')

  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(mobileNav).toBeHidden()

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(mobileNav).toBeVisible()

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(mobileNav).toBeHidden()
})

test('mobile navigation resets after navigating to another page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await navigateFromMobileMenu(page, {
    linkName: 'About',
    urlPattern: /\/about\/$/
  })

  await expect(page).toHaveURL(/\/about\/$/)
  await expect(page.locator('[data-mobile-nav-toggle]')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#mobile-nav')).toBeHidden()
})

if (shouldRunVisualSnapshots) {
  test('homepage should match visual snapshot', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('home-page.png')
  })
} else {
  // Keep the configured reason discoverable when snapshots are disabled.
  console.info(visualSnapshotSkipReason)
}

test('desktop navigation to portfolio works', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'Portfolio' }).click()

  await expect(page).toHaveURL(/\/portfolio\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Case studies from real teams/i })).toBeVisible()
})

test('mobile navigation to portfolio works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await navigateFromMobileMenu(page, {
    linkName: 'Portfolio',
    urlPattern: /\/portfolio\/$/
  })

  await expect(page).toHaveURL(/\/portfolio\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Case studies from real teams/i })).toBeVisible()
})

test('desktop navigation to blog works', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'Blog' }).click()

  await expect(page).toHaveURL(/\/blog\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Writing about software architecture/i })).toBeVisible()
})

test('mobile navigation to blog works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await navigateFromMobileMenu(page, {
    linkName: 'Blog',
    urlPattern: /\/blog\/$/
  })

  await expect(page).toHaveURL(/\/blog\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Writing about software architecture/i })).toBeVisible()
})
