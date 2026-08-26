/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, type Locator, type Page, test } from '@playwright/test'

import {
  getProjectGradientMinimumContrast,
  MINIMUM_PROJECT_TEXT_CONTRAST,
  PROJECT_DARK_CANVAS,
  PROJECT_LIGHT_CANVAS
} from '../src/utils/project-brand'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

const expectImageLoaded = async (image: Locator) => {
  await image.scrollIntoViewIfNeeded()
  await expect(image).toBeVisible()
  await expect.poll(async () => image.evaluate(element => (
    element instanceof HTMLImageElement &&
    element.complete &&
    element.naturalWidth > 0
  ))).toBe(true)
}

const expectReadableProjectTitleGradient = async (page: Page) => {
  const root = page.locator('html')

  await expect(root).toHaveAttribute('data-theme', /^(?:dark|light)$/)

  const theme = await root.getAttribute('data-theme')

  if (theme !== 'dark' && theme !== 'light') {
    throw new TypeError(`Expected a resolved color theme, received: ${String(theme)}`)
  }

  const titleGradient = page.locator('[data-project-title-gradient]')

  await expect(titleGradient).toBeVisible()

  const renderedGradient = await titleGradient.evaluate((element, activeTheme) => {
    const project = element.closest('[data-project-brand]')

    if (!(project instanceof HTMLElement)) {
      throw new TypeError('Expected the title gradient inside a project-branded surface')
    }

    const projectStyle = getComputedStyle(project)
    const suffix = activeTheme === 'dark' ? '-dark' : ''

    return {
      backgroundImage: getComputedStyle(element).backgroundImage,
      primary: projectStyle.getPropertyValue(
        `--project-title-primary-readable${suffix}`
      ).trim(),
      secondary: projectStyle.getPropertyValue(
        `--project-title-secondary-readable${suffix}`
      ).trim()
    }
  }, theme)

  expect(renderedGradient.backgroundImage).toContain('linear-gradient')
  expect(renderedGradient.primary).toMatch(/^#[\da-f]{6}$/iu)
  expect(renderedGradient.secondary).toMatch(/^#[\da-f]{6}$/iu)

  const canvas = theme === 'dark' ? PROJECT_DARK_CANVAS : PROJECT_LIGHT_CANVAS

  expect(getProjectGradientMinimumContrast(
    renderedGradient.primary,
    renderedGradient.secondary,
    canvas
  )).toBeGreaterThanOrEqual(MINIMUM_PROJECT_TEXT_CONTRAST)
}

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

  test('work timeline should render a compact chronological ledger', async ({ page }) => {
    await page.goto('/work/')

    const timelineRows = page.locator('[data-career-timeline] [data-timeline-row]')
    const timelineRowCount = await timelineRows.count()

    expect(timelineRowCount).toBeGreaterThan(0)
    await expect(timelineRows.first()).toContainText('Current')
    await expect(timelineRows.first()).toContainText('May 2025 - Present')
    await expect(timelineRows.locator('img')).toHaveCount(0)

    const activeRowGeometry = await timelineRows.first().evaluate(row => {
      const link = row.querySelector('a')
      const timeline = row.closest('[data-career-timeline]')

      if (!(link instanceof HTMLAnchorElement) || !(timeline instanceof HTMLOListElement)) {
        throw new TypeError('Expected a linked timeline row inside an ordered timeline')
      }

      const linkRect = link.getBoundingClientRect()
      const timelineRect = timeline.getBoundingClientRect()

      return {
        leftOffset: Math.abs(linkRect.left - timelineRect.left),
        widthDifference: Math.abs(linkRect.width - timelineRect.width)
      }
    })

    expect(activeRowGeometry.leftOffset).toBeLessThanOrEqual(1)
    expect(activeRowGeometry.widthDifference).toBeLessThanOrEqual(2)

    const activeLink = timelineRows.first().locator('[data-career-link]')
    const restingBackground = await activeLink.evaluate(link => getComputedStyle(link).backgroundColor)

    await activeLink.hover()

    const projectPrimary = await timelineRows.first().evaluate(row => getComputedStyle(row)
      .getPropertyValue('--project-primary')
      .trim())

    expect(projectPrimary).not.toBe('')
    await expect.poll(async () => activeLink.evaluate(link => getComputedStyle(link).backgroundColor))
      .not.toBe(restingBackground)
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('project title gradient remains readable across color themes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/portfolio/smith-commerce/')

    const root = page.locator('html')
    const themeToggle = page.getByRole('button', { name: 'Toggle color theme' })

    await expect(root).toHaveAttribute('data-theme', 'light')
    await expectReadableProjectTitleGradient(page)
    await expect(page.locator('h1 .blur-sm')).toHaveCount(0)
    await expect(page.locator('[data-project-title-glow]')).toHaveCount(0)
    await expectNoUnexpectedAccessibilityViolations(page)

    await themeToggle.click()

    await expect(root).toHaveAttribute('data-theme', 'dark')
    await expectReadableProjectTitleGradient(page)
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('project images should use the aspect ratio intended for each layout', async ({ page }) => {
    await page.goto('/portfolio/')

    const featuredImage = page.locator('[data-portfolio-project="featured"] img').first()
    const supportingImage = page.locator('[data-portfolio-project="supporting"] img').first()

    await expectImageLoaded(featuredImage)
    await expectImageLoaded(supportingImage)

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

    const projectHero = page.locator('main article img[src*="cover-commerce-system"]').first()

    await expectImageLoaded(projectHero)

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

    const relatedImage = page.locator('[data-portfolio-project="supporting"] img').first()

    await expectImageLoaded(relatedImage)

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
