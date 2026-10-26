import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Technologies index page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/technologies/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Capabilities & Technologies/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should connect the index total and most recurring technology to portfolio evidence', async ({ page }) => {
    const summary = page.getByRole('region', { name: 'Range, with a trail.' })
    const total = await page.locator('[data-technology-item]').count()

    await expect(summary.locator('[data-technology-summary-number]')).toHaveText(String(total))
    await expect(summary.getByRole('link')).toHaveAccessibleName('Most recurring TypeScript Listed in 20 entries Explore the evidence')
    await summary.getByRole('link').click()
    await expect(page).toHaveURL(/\/technologies\/typescript\/$/u)
    await expect(page.locator('[data-project-gallery-card]')).toHaveCount(20)
  })

  test('should render technology group labels', async ({ page }) => {
    // At least the Core group should always be present given the real data
    await expect(page.getByText('Core', { exact: true })).toBeVisible()
  })

  test('should render grouped technology links with project counts', async ({ page }) => {
    const groups = page.locator('[data-technology-group]')
    const links = groups.getByRole('link')

    await expect(groups).toHaveCount(3)
    expect(await links.count()).toBeGreaterThan(100)
    await expect(groups.getByRole('list')).toHaveCount(3)
    await expect(links.first()).toHaveAccessibleName(/^React\.js \d+ projects$/u)
    await expect(links.first()).toHaveAttribute('href', '/technologies/react-js/')
    await expect(links.first().locator('[data-technology-project-count]')).toBeVisible()
  })

  test('should link back to the portfolio', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to portfolio/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', /^\/portfolio\/$/)
  })

  test('technology evidence invitation keeps both destinations keyboard accessible', async ({ page, browserName }) => {
    const invitation = page.getByRole('region', { name: 'Tools are easier to trust when they point to real work.' })
    const portfolio = invitation.getByRole('link', { name: 'Browse portfolio' })
    const writing = invitation.getByRole('link', { name: 'Read the writing' })

    await expect(invitation.getByRole('link')).toHaveCount(2)
    await expect(portfolio).toHaveAttribute('href', '/portfolio/')
    await expect(writing).toHaveAttribute('href', '/blog/')
    await portfolio.focus()
    await expect(portfolio).toBeInViewport()
    await expect(portfolio).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(writing).toBeFocused()
    await expect(writing).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/$/u)
  })

  test('technology archives separate projects from work experience', async ({ page }) => {
    await page.goto('/technologies/typescript/')

    const projectsHeading = page.getByRole('heading', {
      level: 2,
      name: 'Projects',
      exact: true
    })

    const workHeading = page.getByRole('heading', {
      level: 2,
      name: 'Work experience',
      exact: true
    })

    await expect(projectsHeading).toBeVisible()
    await expect(workHeading).toBeVisible()

    const projectsSection = page.getByRole('region', { name: 'Projects', exact: true })
    const workSection = page.getByRole('region', { name: 'Work experience', exact: true })

    expect(await projectsSection.locator('[data-project-gallery-card]').count()).toBeGreaterThan(0)
    expect(await workSection.locator('[data-project-gallery-card]').count()).toBeGreaterThan(0)
    await expect(page.locator('[data-portfolio-project]')).toHaveCount(0)
    await expect(page.locator('[data-project-preview-card]')).toHaveCount(0)
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('technologies-index.png')
    })
  }
})

test('technology project labels keep sufficient contrast on dark card surfaces', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/technologies/3rd-party-apis/')

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('.projects-editorial-action').first()).toContainText('View project')
  await expectNoUnexpectedAccessibilityViolations(page)
  const project = page.locator('.projects-editorial-link').first()

  await project.hover()
  await expectNoUnexpectedAccessibilityViolations(page)
  await project.focus()
  await expect(project).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/portfolio\/.+\/$/u)
})

test('technology catalog remains browseable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })

  try {
    const page = await context.newPage()

    await page.goto('/technologies/')
    await expect(page.locator('[data-technology-group]')).toHaveCount(3)
    const firstLink = page.locator('[data-technology-item] a').first()

    await expect(firstLink).toBeVisible()
    await firstLink.click()
    await expect(page).toHaveURL(/\/technologies\/react-js\/$/u)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('React.js')
  } finally {
    await context.close()
  }
})
