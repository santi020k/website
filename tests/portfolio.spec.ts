import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import {
  shouldRunVisualSnapshots,
  visualSnapshotSkipReason
} from './helpers/visual-regression'

import { expect, test } from '@playwright/test'

test.describe('Portfolio page', () => {
  test('index should have the correct title and list projects', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page).toHaveTitle(/Portfolio/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Ensure at least one project is listed
    const projectCards = page.locator('article a')
    await expect(projectCards.first()).toBeVisible()
  })

  test('technology overflow pill should open the technologies index', async ({ page }) => {
    await page.goto('/portfolio/')

    const overflowTechnologyLink = page.getByRole('link', {
      name: /\+\d+\s+technologies/i
    }).last()

    await expect(overflowTechnologyLink).toBeVisible()
    await overflowTechnologyLink.click()

    await expect(page).toHaveURL(/\/technologies\/$/)
    await expect(page.getByRole('heading', { level: 1, name: /A frontend-first stack with full-stack range/i })).toBeVisible()
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
    await expectNoUnexpectedAccessibilityViolations(page, [
      {
        htmlIncludes: '<dl class="mt-4 space-y-4 text-sm/6 text-ink-soft">',
        id: 'definition-list'
      },
      {
        id: 'dlitem',
        targetIncludes: '.gap-3.flex'
      },
      {
        htmlIncludes: '<aside class="space-y-4">',
        id: 'landmark-complementary-is-top-level'
      },
      {
        htmlIncludes: 'editorial-rail',
        id: 'landmark-complementary-is-top-level'
      }
    ])
  })

  test('single project page should match visual snapshot', async ({ page }) => {
    test.skip(!shouldRunVisualSnapshots, visualSnapshotSkipReason)

    const slug = 'eslint-config-santi020k'
    await page.goto(`/portfolio/${slug}/`)
    await expect(page).toHaveScreenshot('portfolio-project.png')
  })
})
