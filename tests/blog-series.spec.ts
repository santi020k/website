import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Blog series index page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/series/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Blog Series/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display the stats panel', async ({ page }) => {
    const statLabels = page.locator('.ui-stat-label')

    await expect(statLabels.filter({ hasText: 'Active series' })).toBeVisible()
    await expect(statLabels.filter({ hasText: 'Posts grouped' })).toBeVisible()
    await expect(statLabels.filter({ hasText: 'Reading tracks' })).toBeVisible()
  })

  test('should render at least one series card', async ({ page }) => {
    const seriesSection = page.getByRole('heading', { name: /Current series on the site/i })
    await expect(seriesSection).toBeVisible()
    const cards = page.locator('section').filter({ has: seriesSection }).locator('article')
    await expect(cards.first()).toBeVisible()
  })

  test('should link back to the blog index', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to blog/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', /^\/blog\/$/)
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('blog-series-index.png')
    })
  }
})

const seriesHeadings = [
  { route: '/blog/series/building-a-production-nextjs-app/', heading: 'Building a Production Next.js App. A reading track.' },
  { route: '/blog/series/eslint-in-practice/', heading: 'ESLint in Practice. A reading track.' },
  { route: '/blog/series/the-santi020k-way/', heading: 'The santi020k way. A reading track.' }
]

for (const { route, heading } of seriesHeadings) {
  test(`series heading ends its title with a full stop before the reading track on ${route}`, async ({ page }) => {
    await page.goto(route)

    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(heading)
  })
}

for (const route of ['/blog/', '/blog/series/']) {
  test(`series cards open their reading track with one keyboard stop on ${route}`, async ({ page }) => {
    await page.goto(route)
    const cards = page.locator('[data-series-card]')

    expect(await cards.count()).toBeGreaterThan(0)
    for (const card of await cards.all()) {
      await expect(card.getByRole('link')).toHaveCount(1)
      await expect(card.getByRole('link')).toHaveAccessibleName(/Explore series/u)
      await expect(card.getByRole('list', { name: 'Focus areas' })).toBeVisible()
    }
    const card = cards.first()
    const title = await card.getByRole('heading').innerText()
    const link = card.getByRole('link')
    const href = await link.getAttribute('href')

    expect(href).toMatch(/^\/blog\/series\/[^/]+\/$/u)
    await page.keyboard.press('Tab')
    await link.focus()
    await expect(link).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(href ?? '')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(title)
  })
}
