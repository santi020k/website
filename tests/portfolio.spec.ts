import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

import { expect, test } from '@playwright/test'

test.describe('Portfolio page', () => {
  test('index should have the correct title and list sections', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page).toHaveTitle(/Portfolio/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Ensure the two sections (Work and Projects) are listed
    const sections = page.locator('section .panel-card')
    await expect(sections).toHaveCount(2)
    await expect(sections.first().getByRole('link', { name: /Browse work/i })).toBeVisible()
    await expect(sections.last().getByRole('link', { name: /Browse projects/i })).toBeVisible()
  })

  test('technology overflow pill should open the technologies index', async ({ page }) => {
    await page.goto('/work/')

    const overflowTechnologyLink = page.getByRole('link', {
      name: /\+\d+\s+technologies/i
    }).last()

    if (await overflowTechnologyLink.isVisible()) {
      await overflowTechnologyLink.click()
      await expect(page).toHaveURL(/\/technologies\/$/)
      await expect(page.getByRole('heading', { level: 1, name: /Frontend-first stack/i })).toBeVisible()
    }
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/portfolio/')
    await expectNoUnexpectedAccessibilityViolations(page, [
      {
        htmlIncludes: 'href="/pdf/cv.pdf"',
        id: 'color-contrast'
      }
    ])
  })

  test('index should match visual snapshot', async ({ page }) => {
    test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)
    await page.goto('/portfolio/')
    await expect(page).toHaveScreenshot('portfolio-index.png')
  })

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

    // Accessibility audit
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('single project page should match visual snapshot', async ({ page }) => {
    test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)

    const slug = 'eslint-config-santi020k'
    await page.goto(`/portfolio/${slug}/`)
    await expect(page).toHaveScreenshot('portfolio-project.png')
  })
})
