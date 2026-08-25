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
      name: /^Explore \d+ more$/i
    })

    await expect(overflowTechnologyLink).toBeVisible()
    await overflowTechnologyLink.click()
    await expect(page).toHaveURL(/\/technologies\/$/)
    await expect(page.getByRole('heading', { level: 1, name: /Capabilities and technologies/i })).toBeVisible()
  })

  test('work timeline should render project artwork', async ({ page }) => {
    await page.goto('/work/')

    const timelineItems = page.locator('[data-career-timeline] [data-timeline-artwork]')
    const timelineImages = timelineItems.locator('img')
    const timelineCardCount = await page.locator('[data-career-timeline] [data-timeline-card]').count()

    expect(timelineCardCount).toBeGreaterThan(0)
    await expect(timelineItems).toHaveCount(timelineCardCount)
    await expect(timelineImages).toHaveCount(timelineCardCount)
    await expect(timelineImages.first()).toBeVisible()
    await expect(timelineImages.first()).toHaveAttribute('alt', '')
    await expect(timelineImages.first()).toHaveAttribute('src', /cover-horizontal/)
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('project images should use the aspect ratio intended for each layout', async ({ page }) => {
    await page.goto('/portfolio/')

    const featuredImage = page.locator('[data-portfolio-project="featured"] img').first()
    const supportingImage = page.locator('[data-portfolio-project="supporting"] img').first()

    await expect(featuredImage).toBeVisible()
    await expect(supportingImage).toBeVisible()

    const featuredRatios = await featuredImage.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) throw new TypeError('Expected a featured image')

      const rect = element.getBoundingClientRect()

      return {
        natural: element.naturalWidth / element.naturalHeight,
        rendered: rect.width / rect.height
      }
    })

    const supportingRatios = await supportingImage.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) throw new TypeError('Expected a supporting image')

      const rect = element.getBoundingClientRect()

      return {
        natural: element.naturalWidth / element.naturalHeight,
        rendered: rect.width / rect.height
      }
    })

    expect(featuredRatios.natural).toBeCloseTo(16 / 9, 2)
    expect(featuredRatios.rendered).toBeCloseTo(16 / 9, 2)
    expect(supportingRatios.natural).toBeCloseTo(16 / 10, 2)
    expect(supportingRatios.rendered).toBeCloseTo(16 / 10, 2)

    await page.goto('/portfolio/smith-commerce/')

    const projectHero = page.locator('main article img[src*="cover-horizontal"]').first()

    await expect(projectHero).toBeVisible()

    const projectHeroRatios = await projectHero.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) throw new TypeError('Expected a project hero image')

      const rect = element.getBoundingClientRect()

      return {
        natural: element.naturalWidth / element.naturalHeight,
        rendered: rect.width / rect.height
      }
    })

    expect(projectHeroRatios.natural).toBeCloseTo(16 / 9, 2)
    expect(projectHeroRatios.rendered).toBeCloseTo(16 / 9, 2)

    const relatedImage = page.locator('[data-project-preview-media]').first()

    await relatedImage.scrollIntoViewIfNeeded()
    await expect(relatedImage).toBeVisible()
    await expect(relatedImage).toHaveAttribute('width', '1280')
    await expect(relatedImage).toHaveAttribute('height', '800')
    await expect.poll(async () => relatedImage.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) throw new TypeError('Expected a related image')

      return element.naturalWidth
    })).toBeGreaterThan(0)

    const relatedRatios = await relatedImage.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) throw new TypeError('Expected a related image')

      const rect = element.getBoundingClientRect()

      return {
        natural: element.naturalWidth / element.naturalHeight,
        rendered: rect.width / rect.height
      }
    })

    expect(relatedRatios.natural).toBeCloseTo(16 / 10, 2)
    expect(relatedRatios.rendered).toBeCloseTo(16 / 10, 2)

    await page.setViewportSize({ height: 812, width: 375 })
    await expect(relatedImage).toBeVisible()

    const mobileLayout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }))

    expect(mobileLayout.scrollWidth).toBeLessThanOrEqual(mobileLayout.viewportWidth)

    await page.getByRole('button', { name: 'Toggle color theme' }).click()

    const alternateThemeLayout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }))

    expect(alternateThemeLayout.scrollWidth).toBeLessThanOrEqual(alternateThemeLayout.viewportWidth)
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
