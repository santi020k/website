/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Portfolio page', () => {
  test('index should have the correct title and list sections', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page).toHaveTitle(/Portfolio/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Ensure the two sections (Work and Projects) are listed
    const sections = page.locator('[data-portfolio-section]')
    await expect(sections).toHaveCount(2)
    await expect(sections.first().getByRole('link', { name: /Browse work/i })).toBeVisible()
    await expect(sections.last().getByRole('link', { name: /Browse projects/i })).toBeVisible()
  })

  test('technology overflow pill should open the technologies index', async ({ page }) => {
    await page.goto('/work/')

    const overflowTechnologyLink = page.getByRole('link', {
      name: /\+\d+\s+technologies/i
    }).last()

    await expect(overflowTechnologyLink).toBeVisible()
    await overflowTechnologyLink.click()
    await expect(page).toHaveURL(/\/technologies\/$/)
    await expect(page.getByRole('heading', { level: 1, name: /Capabilities and technologies/i })).toBeVisible()
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('index should match visual snapshot', async ({ page }) => {
      await page.goto('/portfolio/')
      await expect(page).toHaveScreenshot('portfolio-index.png')
    })
  }

  test('project with case study frontmatter shows the summary grid', async ({ page }) => {
    await page.goto('/portfolio/datagran/')

    const summary = page.getByRole('region', { name: 'Case study summary' })
    await expect(summary).toBeVisible()
    await expect(summary.getByText(/^Problem$/)).toBeVisible()
    await expect(summary.getByText(/^Approach$/)).toBeVisible()
    await expect(summary.getByText(/^Outcome$/)).toBeVisible()
    await expect(summary.getByText(/^Metrics$/)).toBeVisible()
  })

  test('single project page should load correctly', async ({ page }) => {
    // Navigate to a known project
    const slug = 'eslint-config-santi020k'
    await page.goto(`/portfolio/${slug}/`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main article').first()).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Table of contents' })).toBeVisible()

    const readingProgress = page.getByRole('progressbar', { name: 'Reading progress' })

    await expect(readingProgress).toBeVisible()
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
    // eslint-disable-next-line @cspell/spellchecker
    await expect.poll(async () => Number(await readingProgress.getAttribute('aria-valuenow')))
      .toBeGreaterThan(90)

    // Accessibility audit
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('single project page should match visual snapshot', async ({ page }) => {
      const slug = 'eslint-config-santi020k'
      await page.goto(`/portfolio/${slug}/`)
      await expect(page).toHaveScreenshot('portfolio-project.png')
    })
  }
})
