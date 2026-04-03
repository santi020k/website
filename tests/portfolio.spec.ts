import { AxeBuilder } from '@axe-core/playwright'
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
    await expect(page.getByRole('heading', { level: 1, name: /Tools, platforms, and systems/i })).toBeVisible()
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/portfolio/')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('index should match visual snapshot', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page).toHaveScreenshot('portfolio-index.png')
  })

  test('single project page should load correctly', async ({ page }) => {
    // Navigate to a known project
    const slug = 'eslint-config-santi020k'
    await page.goto(`/portfolio/${slug}/`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main article').first()).toBeVisible()

    // Accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])

    // Visual snapshot
    await expect(page).toHaveScreenshot('portfolio-project.png')
  })
})
