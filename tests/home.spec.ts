/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

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
  await expect(menuToggle).toHaveAttribute('aria-expanded', /^true$/)
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
  await expect(mainMenu.getByRole('link', { name: 'Work' })).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Projects' })).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Blog' })).toBeVisible()
  await expect(page.locator('body')).toBeVisible()
  await expectNoUnexpectedAccessibilityViolations(page)
})

test('homepage exposes shared accessibility affordances', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', /^#main$/)
  await expect(page.getByRole('button', { name: 'Open site search' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Toggle color theme' })).toBeVisible()
  await expect(
    page.locator('header').getByRole('link', { name: /Santiago Molina/i }).first()
  ).toHaveAttribute('href', /^\/$/)
})

test('homepage keeps speaking in the footer navigation only', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('header a[href="/speaking/"]')).toHaveCount(0)
  await expect(page.locator('footer a[href="/speaking/"]')).toHaveCount(1)
})

test('homepage ships no client-side analytics beacon', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('script[src*="cloudflareinsights.com"]')).toHaveCount(0)
  await expect(page.locator('script[data-cf-beacon]')).toHaveCount(0)
})

test('homepage exposes IndieAuth.com discovery and rel=me on silo links', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="authorization_endpoint"]')).toHaveAttribute(
    'href', 'https://indieauth.com/auth'
  )
  await expect(page.locator('link[rel="token_endpoint"]')).toHaveAttribute(
    'href', 'https://tokens.indieauth.com/token'
  )

  const githubProfile = page.locator('footer a[href="https://github.com/santi020k"]')
  const githubRel = await githubProfile.getAttribute('rel')
  expect(githubRel?.split(/\s+/).filter(Boolean).sort()).toEqual(
    ['me', 'noopener', 'noreferrer'].sort()
  )

  for (const link of await page.locator('footer a[href^="https://api.whatsapp.com/"]').all()) {
    const rel = await link.getAttribute('rel')
    expect(rel?.split(/\s+/).filter(Boolean).sort()).toEqual(['noopener', 'noreferrer'].sort())
  }
})

test('keyboard / opens site search dialog', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('/')
  const dialog = page.getByRole('dialog', { name: 'Search' })
  const trigger = page.getByRole('button', { name: 'Open site search' })

  await expect(dialog).toBeVisible()
  await expect(page.getByPlaceholder('Search by title, tag, or keyword…')).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
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

test('homepage project cards have descriptive accessible names', async ({ page }) => {
  await page.goto('/')

  // The new design uses cards that contain headings and are wrapped in links
  // We specifically target h3 elements inside project cards to avoid community cards
  const projectTitles = page.locator('[data-project-card] h3')
  const projectCount = await projectTitles.count()

  expect(projectCount).toBeGreaterThan(0)

  for (let index = 0; index < projectCount; index += 1) {
    const titleElement = projectTitles.nth(index)
    const titleText = await titleElement.innerText()

    // The link is the ancestor 'a' of the title element
    const cardLink = titleElement.locator('xpath=ancestor::a').first()

    expect(titleText.trim().length).toBeGreaterThan(0)
    await expect(cardLink).toContainText(titleText.trim())
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

  await expect(menuToggle).toHaveAttribute('aria-expanded', /^false$/)
  await expect(mobileNav).toBeHidden()

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', /^true$/)
  await expect(mobileNav).toBeVisible()

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', /^false$/)
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
  await expect(page.locator('[data-mobile-nav-toggle]')).toHaveAttribute('aria-expanded', /^false$/)
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

test('desktop navigation to work works', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'Work' }).click()

  await expect(page).toHaveURL(/\/work\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Products shipped/i })).toBeVisible()
})

test('mobile navigation to work works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await navigateFromMobileMenu(page, {
    linkName: 'Work',
    urlPattern: /\/work\/$/
  })

  await expect(page).toHaveURL(/\/work\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Products shipped/i })).toBeVisible()
})

test('desktop navigation to blog works', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'Blog' }).click()

  await expect(page).toHaveURL(/\/blog\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Writing about software/i })).toBeVisible()
})

test('mobile navigation to blog works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await navigateFromMobileMenu(page, {
    linkName: 'Blog',
    urlPattern: /\/blog\/$/
  })

  await expect(page).toHaveURL(/\/blog\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Writing about software/i })).toBeVisible()
})
