import { expect, type Locator, type Page, test } from '@playwright/test'

import {
  getProjectGradientMinimumContrast,
  MINIMUM_PROJECT_TEXT_CONTRAST,
  PROJECT_DARK_CANVAS,
  PROJECT_LIGHT_CANVAS
} from '../src/utils/project-brand'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

const openProjectContents = async (page: Page) => {
  const opener = page.locator('[data-project-mobile-toc] [data-toc-summary]')

  if (await opener.isVisible()) await opener.click()
}

const expectImageLoaded = async (image: Locator) => {
  await image.scrollIntoViewIfNeeded()
  await expect(image).toBeVisible()
  await expect.poll(async () => image.evaluate(element => (
    element instanceof HTMLImageElement &&
    element.complete &&
    element.naturalWidth > 0
  ))).toBe(true)
}

// Intrinsic srcset dimensions and rendered CSS pixels can round independently
// on high-density devices. Check the image content box, excluding decorative
// borders and padding, and bound rounding error in pixels.
const expectImageAspectRatio = async (image: Locator, ratio: number, renderedRatio = ratio) => {
  const dimensions = await image.evaluate(element => {
    if (!(element instanceof HTMLImageElement)) throw new TypeError('Expected a project image')

    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    const horizontalInset = Number.parseFloat(style.borderLeftWidth) +
      Number.parseFloat(style.borderRightWidth) + Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight)
    const verticalInset = Number.parseFloat(style.borderTopWidth) +
      Number.parseFloat(style.borderBottomWidth) + Number.parseFloat(style.paddingTop) +
      Number.parseFloat(style.paddingBottom)

    return {
      height: rect.height - verticalInset,
      naturalHeight: element.naturalHeight,
      naturalWidth: element.naturalWidth,
      width: rect.width - horizontalInset
    }
  })

  expect(Math.abs(dimensions.naturalHeight - dimensions.naturalWidth / ratio)).toBeLessThanOrEqual(1)
  expect(Math.abs(dimensions.height - dimensions.width / renderedRatio)).toBeLessThanOrEqual(1)
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
  test('keeps project artwork clear and the opening in reading order at narrow and enlarged sizes', async ({ page }) => {
    await page.goto('/portfolio/roadscore/')

    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, fontSize)

        const cover = page.locator('[data-project-cover]')
        await expect(cover).toBeVisible()
        await expect(page.locator('[data-project-cover-caption]')).toHaveCount(0)
        await expect(cover.locator('[data-cover-gradient]')).toHaveCount(0)
        await expect(page.locator('[data-editorial-meta-group]')).toBeVisible()

        const layout = await page.locator('[data-project-opening]').evaluate(async element => {
          const title = element.querySelector('h1')
          const image = element.querySelector('img')
          const summary = element.querySelector('[data-editorial-summary]')
          const facts = element.querySelector('[data-editorial-meta-group]')
          if (!title || !image || !summary || !facts) throw new TypeError('Expected a complete project opening')
          await image.decode()
          const art = image.getBoundingClientRect()
          return {
            titleClearsArtwork: title.getBoundingClientRect().bottom <= art.top + art.height * 0.23,
            summaryAfterArtwork: summary.getBoundingClientRect().top >= art.bottom,
            factsAfterSummary: facts.getBoundingClientRect().top >= summary.getBoundingClientRect().bottom,
            renderedRatio: art.width / art.height,
            declaredRatio: Number(image.getAttribute('width')) / Number(image.getAttribute('height')),
            loaded: image.naturalWidth > 0,
            overflow: element.scrollWidth > element.clientWidth + 1
          }
        })

        expect(layout.titleClearsArtwork).toBe(true)
        expect(layout.summaryAfterArtwork).toBe(true)
        expect(layout.factsAfterSummary).toBe(true)
        expect(layout.renderedRatio).toBeCloseTo(layout.declaredRatio, 2)
        expect(layout.loaded).toBe(true)
        expect(layout.overflow).toBe(false)
      }
    }
  })

  test('index should have the correct title and list sections', async ({ page }) => {
    await page.goto('/portfolio/')
    await expect(page).toHaveTitle(/Portfolio/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Ensure the two sections (Work and Projects) are listed
    const sections = page.locator('[data-portfolio-section]')
    await expect(sections).toHaveCount(2)
    await expect(sections.first().getByRole('link', { name: /Full work history/i })).toBeVisible()
    await expect(sections.last().getByRole('link', { name: /All independent projects/i })).toBeVisible()
  })

  test('technology index link should open the full toolkit', async ({ page }) => {
    await page.goto('/work/')

    const technologyIndexLink = page.getByRole('navigation', { name: 'Continue exploring work' }).getByRole('link', {
      name: 'Technology index Explore the full toolkit Browse the tools used across all projects.', exact: true
    })

    await expect(technologyIndexLink).toBeVisible()
    await technologyIndexLink.click()
    await expect(page).toHaveURL(/\/technologies\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Tools, connected to real work.', exact: true })).toBeVisible()
  })

  test('work timeline should render chronological folios', async ({ page }) => {
    await page.goto('/work/')

    const timelineRows = page.locator('[data-career-timeline] [data-timeline-row]')
    const timelineRowCount = await timelineRows.count()

    expect(timelineRowCount).toBeGreaterThan(0)
    await expect(timelineRows.first()).toContainText('Current')
    await expect(timelineRows.first()).toContainText('May 2025 - Present')
    // Company marks are decorative; the row text already names each company.
    await expect(timelineRows.locator('img:not([alt=""])')).toHaveCount(0)

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
    const title = activeLink.locator('[data-career-title]')
    const restingColor = await title.evaluate(element => getComputedStyle(element).color)

    await activeLink.hover()
    await expect.poll(async () => title.evaluate(element => getComputedStyle(element).color))
      .not.toBe(restingColor)
  })

  test('work page keeps readable content and case-study navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/work/')

    await expect(page.getByRole('heading', { level: 1, name: 'Products shipped. Teams led.' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Career at a glance' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open resume', exact: true })).toHaveAttribute('href', '/resume/')

    const firstCaseStudy = page.locator('[data-career-link]').first()
    await firstCaseStudy.focus()
    await expect(firstCaseStudy).toBeFocused()
    await firstCaseStudy.press('Enter')
    await expect(page).toHaveURL(/\/portfolio\/smith-commerce\/$/)
  })

  test('work page fits responsive widths and passes accessibility in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.goto('/work/')
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)

      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }

      await expectNoUnexpectedAccessibilityViolations(page)
    }
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
    const themeToggle = page.getByRole('button', { name: 'Switch theme' })

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

  for (const theme of ['light', 'dark']) {
    test(`portfolio and continuation surfaces preserve their approved treatment in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto('/portfolio/')
      const spotlights = page.locator('[data-portfolio-project]')

      expect(await spotlights.count()).toBeGreaterThan(0)
      for (const card of await spotlights.all()) {
        await expect(card).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
        await expect(card.locator('[data-portfolio-project-body]')).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      }
      for (const route of ['/portfolio/smith-commerce/', '/portfolio/lumen-ui/']) {
        await page.goto(route)
        const cards = page.locator('[data-related-project]')

        await expect(cards).toHaveCount(2)
        for (const card of await cards.all()) {
          await expect(card).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
          await expect(card.locator('[data-related-artwork]')).toBeVisible()
        }
      }
    })
  }

  // Approved spotlight design (docs/sculpted-style-guide.md): featured cards use
  // 4:3 artwork beside the sheet from 56rem of card width, 2:1 artwork above it at
  // intermediate widths, and a 4:3 crop below 36.25rem. Supporting cards keep 16:10
  // until the same 36.25rem threshold. Include the two-column breakpoint explicitly.
  const portfolioIndexLayouts = [
    // Single column, card about 335px wide.
    { featured: 4 / 3, name: 'narrow', supporting: 4 / 3, width: 375 },
    // Single column, cards about 652px wide.
    { featured: 2, name: 'mid single-column', supporting: 16 / 10, width: 700 },
    // Featured about 720px wide; supporting pairs about 348px wide.
    { featured: 2, name: 'mid two-column', supporting: 4 / 3, width: 768 },
    // Featured about 1152px wide; supporting pairs about 564px wide.
    { featured: 4 / 3, name: 'wide', supporting: 4 / 3, width: 1280 }
  ] as const

  for (const layout of portfolioIndexLayouts) {
    test(`index project images use the intended ${layout.name} aspect ratios`, async ({ page }) => {
      await page.setViewportSize({ height: 900, width: layout.width })
      await page.goto('/portfolio/')

      const featuredImage = page.locator('[data-portfolio-project="featured"] img').first()
      const supportingImage = page.locator('[data-portfolio-project="supporting"] img').first()

      await expectImageLoaded(featuredImage)
      await expectImageLoaded(supportingImage)

      await expectImageAspectRatio(featuredImage, 16 / 10, layout.featured)
      await expectImageAspectRatio(supportingImage, 16 / 10, layout.supporting)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(layout.width)
    })
  }

  test('project page images use the intended aspect ratios without overflow', async ({ page }) => {
    await page.setViewportSize({ height: 720, width: 1280 })
    await page.goto('/portfolio/smith-commerce/')

    const projectHero = page.locator('main article img[src*="cover-commerce-system"]').first()

    await expectImageLoaded(projectHero)

    await expectImageAspectRatio(projectHero, 16 / 9)

    const relatedImage = page.locator('[data-related-project] img').first()

    await expectImageLoaded(relatedImage)

    await expectImageAspectRatio(relatedImage, 16 / 9, 16 / 10)

    await page.setViewportSize({ height: 812, width: 375 })
    await expect(relatedImage).toBeVisible()
    await expectImageAspectRatio(relatedImage, 16 / 9, 1)

    const mobileLayout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }))

    expect(mobileLayout.scrollWidth).toBeLessThanOrEqual(mobileLayout.viewportWidth)

    await page.getByRole('button', { name: 'Switch theme' }).click()

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

  test('project with case study frontmatter shows the summary chapters', async ({ page }) => {
    await page.goto('/portfolio/datagran/')

    const summary = page.getByRole('region', { name: 'Case study summary' })
    await expect(summary).toBeVisible()
    await expect(summary.getByRole('heading', { level: 2 })).toHaveText('Case study')
    await expect(summary.getByRole('heading', { level: 3 })).toHaveText(['Problem', 'Approach', 'Outcome', 'Metrics'])
    await expect(summary.getByRole('listitem')).toHaveCount(4)

    await page.goto('/portfolio/auth/')
    const authSummary = page.getByRole('region', { name: 'Case study summary' })
    await expect(authSummary.getByRole('heading', { level: 3 })).toHaveText(['Problem', 'Approach', 'Outcome'])
    await expect(authSummary.getByRole('listitem')).toHaveCount(3)

    await page.goto('/portfolio/smith-commerce/')
    await expect(page.getByRole('region', { name: 'Case study summary' })).toHaveCount(0)
  })

  test('single project page should load correctly', async ({ page }) => {
    // Navigate to a known project
    const slug = 'eslint-config-santi020k'
    await page.goto(`/portfolio/${slug}/`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main article').first()).toBeVisible()
    await openProjectContents(page)
    await expect(page.getByRole('navigation', { name: 'Table of contents' })).toBeVisible()

    const readingProgress = page.getByRole('progressbar', { name: 'Reading progress' })

    await expect(readingProgress).toBeVisible()
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
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
