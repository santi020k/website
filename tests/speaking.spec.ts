import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Speaking page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/speaking/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Speaking/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should contain the key sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ReactJS Colombia/i, level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /talks, in one timeline/i, level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Bring the audience/i, level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /What I speak about/i, level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Available formats/i, level: 2 })).toBeVisible()
  })

  test('should expose the invite CTA with a WhatsApp href', async ({ page }) => {
    const ctaLinks = page.getByRole('link', { name: /Invite me to speak/i })
    await expect(ctaLinks.first()).toBeVisible()
    await expect(ctaLinks.first()).toHaveAttribute('href', /^https:\/\/api\.whatsapp\.com\/send/)
    await expect(ctaLinks.first()).toHaveAttribute('href', /Speaking%20page|speaking%20page/i)
  })

  test('should link to LinkedIn', async ({ page }) => {
    const linkedInLink = page.getByRole('link', { name: /Connect on LinkedIn/i })
    await expect(linkedInLink.first()).toBeVisible()
    await expect(linkedInLink.first()).toHaveAttribute('href', /linkedin/)
  })

  test('should present ReactJS Colombia as community work', async ({ page }) => {
    const communityHeading = page.getByRole('heading', { name: /ReactJS Colombia/i, level: 2 })
    const communitySection = page.locator('section').filter({ has: communityHeading })

    await expect(communitySection.getByText('Co-Organizer')).toBeVisible()
    await expect(communitySection.getByRole('link', { name: /Visit the community/i }))
      .toHaveAttribute('href', /meetup\.com/)
    await expect(communitySection.getByRole('link', { name: /Read the community story/i }))
      .toHaveAttribute('href', '/portfolio/react-js-colombia/')
  })

  test('should render the complete speaking history as an evidence-labeled timeline', async ({ page }) => {
    const timeline = page.locator('[data-speaking-timeline]')
    const rows = timeline.locator('[data-speaking-row]')

    await expect(rows).toHaveCount(8)
    await expect(rows.first()).toContainText('How to Automate Front End Processes')
    await expect(rows.last()).toContainText('CSS, Sass, and Preprocessors')
    await expect(timeline.locator('[data-speaking-row][data-evidence="public"]')).toHaveCount(6)
    await expect(timeline.locator('[data-speaking-row][data-evidence="private"]')).toHaveCount(1)
    await expect(timeline.locator('[data-speaking-row][data-evidence="reconstructed"]')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Unit Testing with React' }))
      .toBeVisible()
    await expect(page.getByRole('link', { name: /Event record/i }).first())
      .toHaveAttribute('href', /meetup\.com/)

    const timelineTag = await timeline.evaluate(element => element.tagName)
    expect(timelineTag).toBe('OL')
  })

  test('should preserve complete topic headings and matching expertise', async ({ page }) => {
    const topicsSection = page.getByRole('heading', { name: /What I speak about/i })
    await expect(topicsSection).toBeVisible()
    const topicArticles = page.locator('section').filter({ has: topicsSection }).locator('article')
    const titles = [
      'Engineering leadership for teams that still ship',
      'Developer experience that compounds',
      'Frontend architecture for real teams',
      'Quality systems that fit the workflow',
      'Full-stack delivery with technical range',
      'Community building and first-time speakers'
    ]

    await expect(topicArticles).toHaveCount(titles.length)
    for (const title of titles) {
      await expect(topicArticles.getByRole('heading', { level: 3, name: title, exact: true })).toBeVisible()
    }
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents()

    for (const title of titles) expect(schema.join('\n')).toContain(JSON.stringify(title))
  })

  test('should preserve complete format headings and structured data', async ({ page }) => {
    const cards = page.locator('[data-talk-card="format"]')
    const titles = [
      'Meetups and community talks',
      'Workshops and live build sessions',
      'Internal engineering enablement',
      'Panels, Q&A, and leadership conversations'
    ]

    await expect(cards).toHaveCount(titles.length)
    for (const title of titles) {
      await expect(cards.getByRole('heading', { level: 3, name: title, exact: true })).toBeVisible()
    }
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents()

    for (const title of titles) expect(schema.join('\n')).toContain(JSON.stringify(title))
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('speaking-page.png')
    })
  }
})
