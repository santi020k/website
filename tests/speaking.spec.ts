import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations, waitForVisibleAnimations } from './helpers/accessibility'
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

  test('statistic captions connect to supporting work in the same tab', async ({ page, request }) => {
    const sources = page.locator('[data-stats-section] [data-stat-source]').getByRole('link')
    await expect(sources).toHaveText(['Career timeline', 'ReactJS Colombia', 'Read the articles'])

    for (const source of await sources.all()) {
      await expect(source).not.toHaveAttribute('target', '_blank')
      const href = await source.evaluate((anchor: HTMLAnchorElement) => anchor.pathname)
      expect((await request.get(href)).status()).toBe(200)
    }

    const career = sources.first()
    await career.focus()
    await expect(career).toBeFocused()
    await expect(career).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/work/#experience-heading')
    await expect(page.locator('#experience-heading')).toBeInViewport()
  })

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`chapter guide reaches each section with ${reducedMotion} motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion })
      const guide = page.getByRole('navigation', { name: 'Explore speaking' })
      await expect(guide.getByRole('link')).toHaveCount(4)
      const originalDocument = await page.evaluateHandle(() => document)
      for (const id of ['topics', 'formats', 'history', 'community']) {
        const destination = `#speaking-${id}`
        const link = guide.locator(`a[href="${destination}"]`)
        await expect(link).toHaveAccessibleName(id.charAt(0).toUpperCase() + id.slice(1))
        await expect(link).not.toHaveAttribute('target', '_blank')
        await link.scrollIntoViewIfNeeded()
        await link.focus()
        await expect(link).toBeFocused()
        await expect(link).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(`/speaking/${destination}`)
        await expect(page.locator(destination).getByRole('heading', { level: 2 })).toBeInViewport()
        expect(await page.evaluate(initial => initial === document, originalDocument)).toBe(true)
      }
      await originalDocument.dispose()
    })
  }

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`hero invitation leads to the brief in the same document with ${reducedMotion} motion`, async ({ browserName, page }) => {
      await page.emulateMedia({ reducedMotion })
      const hero = page.locator('[data-speaking-hero]')
      const invitation = hero.getByRole('link', { name: 'Plan a session', exact: true })
      await expect(hero.getByRole('link')).toHaveCount(1)
      await expect(hero).toContainText('Start with the brief, then choose WhatsApp or LinkedIn.')
      await expect(invitation).toHaveAttribute('href', '#speaking-booking-heading')
      await expect(invitation).not.toHaveAttribute('target', '_blank')
      const originalDocument = await page.evaluateHandle(() => document)
      await invitation.scrollIntoViewIfNeeded()
      await invitation.focus()
      await expect(invitation).toBeFocused()
      await expect(invitation).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL('/speaking/#speaking-booking-heading')
      await expect(page.locator('#speaking-booking-heading')).toBeInViewport()
      expect(await page.evaluate(initial => initial === document, originalDocument)).toBe(true)
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(page.getByRole('region', { name: 'Start with a brief.' }).getByRole('link', { name: 'Message on WhatsApp' })).toBeFocused()
      await originalDocument.dispose()
    })
  }

  test('should link to LinkedIn', async ({ page }) => {
    const linkedInLink = page.getByRole('link', { name: /Connect on LinkedIn/i })
    await expect(linkedInLink.first()).toBeVisible()
    await expect(linkedInLink.first()).toHaveAttribute('href', /linkedin/)
  })

  test('should expose the complete speaker identity and loaded portrait', async ({ page }) => {
    const profile = page.getByRole('complementary', { name: 'Speaker profile' })
    await expect(profile.getByRole('heading', { level: 2, name: 'Santiago Molina' })).toBeVisible()
    await expect(profile).toContainText('Engineering leader, full-stack architect, and ReactJS Colombia co-organizer.')
    await expect(profile.locator('dt')).toHaveText(['Community', 'Based in'])
    await expect(profile.locator('dd')).toHaveText(['Since 2017', 'Medellín'])
    const portrait = profile.getByRole('img', { name: 'Santiago Molina, engineering leader and speaker' })
    await expect(portrait).toBeVisible()
    await expect.poll(() => portrait.evaluate(image => {
      if (!(image instanceof HTMLImageElement)) return false

      return image.complete && image.naturalWidth > 0
    })).toBe(true)
  })

  test('should keep the booking brief and protected contact actions accessible', async ({ browserName, page }) => {
    const booking = page.getByRole('region', { name: 'Start with a brief.' })
    await expect(booking).toContainText('Include the event, audience, date range, preferred format, and the outcome')
    for (const name of ['Best fit', 'Helpful details', 'Tailoring']) {
      await expect(booking.getByRole('heading', { name, exact: true })).toBeVisible()
    }

    await expect(booking).toContainText('For a quick introduction')
    await expect(booking).toContainText('Prefer a fuller brief?')
    const contact = booking.getByRole('link', { name: 'Message on WhatsApp' })
    const href = await contact.getAttribute('href')
    expect(href).not.toBeNull()
    const destination = new URL(href ?? '')
    expect(destination.origin).toBe('https://api.whatsapp.com')
    expect(destination.pathname).toBe('/send')
    expect(destination.searchParams.get('text')).toContain('Event: Audience: Date: Format: Goal:')
    await expect(contact).toHaveAttribute('target', '_blank')
    await expect(contact).toHaveAttribute('rel', /\bnoopener\b/)
    await expect(contact).toHaveAttribute('rel', /\bnoreferrer\b/)
    await contact.focus()
    await expect(contact).toBeFocused()
    await expect(contact).toHaveCSS('outline-style', 'solid')

    const linkedIn = booking.getByRole('link', { name: 'Connect on LinkedIn', exact: true })
    await expect(linkedIn).toHaveAttribute('href', 'https://linkedin.com/in/santi020k')
    await expect(linkedIn).toHaveAttribute('target', '_blank')
    await expect(linkedIn).toHaveAttribute('rel', /\bnoopener\b/)
    await expect(linkedIn).toHaveAttribute('rel', /\bnoreferrer\b/)
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(linkedIn).toBeFocused()
    await expect(linkedIn).toHaveCSS('outline-style', 'solid')
  })

  test('should present ReactJS Colombia as community work', async ({ browserName, page }) => {
    const communityHeading = page.getByRole('heading', { name: /ReactJS Colombia/i, level: 2 })
    const communitySection = page.locator('section').filter({ has: communityHeading })

    await expect(communitySection.getByText('Co-Organizer')).toBeVisible()
    await expect(communitySection.getByRole('link', { name: /Visit the community/i }))
      .toHaveAttribute('href', /meetup\.com/)
    await expect(communitySection.getByRole('link', { name: /Read the community story/i }))
      .toHaveAttribute('href', '/portfolio/react-js-colombia/')

    const evidence = communitySection.getByRole('list', { name: 'Community impact' }).getByRole('listitem')
    await expect(evidence).toHaveText([
      /Dozens of events since 2017/,
      /100\+ participants at peak sessions/,
      /Community talks, workshops, and mentorship across experience levels/
    ])
    const visit = communitySection.getByRole('link', { name: 'Visit the community' })
    await expect(visit).toHaveAttribute('target', '_blank')
    await expect(visit).toHaveAttribute('rel', /\bnoopener\b/)
    await expect(visit).toHaveAttribute('rel', /\bnoreferrer\b/)
    await visit.focus()
    await expect(visit).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(communitySection.getByRole('link', { name: 'Read the community story' })).toBeFocused()
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

    const first = rows.first()
    await expect(first.locator('time')).toHaveAttribute('datetime', '2024-06-26')
    await expect(first.locator('time')).toHaveText('Jun 26 2024')
    await expect(first.getByRole('list', { name: 'Topics', exact: true }).getByRole('listitem'))
      .toHaveText(['Frontend', 'Automation', 'DX'])
    const privateSessions = rows.filter({ hasText: 'Company Talks and Client Workshops' })
    const reconstructed = rows.filter({ hasText: 'CSS, Sass, and Preprocessors' })
    await expect(privateSessions).toContainText('2017–2018')
    await expect(privateSessions).toContainText('Private sessions')
    await expect(reconstructed).toContainText('c. 2014–2017')
    await expect(reconstructed).toContainText('Reconstructed')
    for (const qualified of [privateSessions, reconstructed]) {
      await expect(qualified.locator('time[datetime]')).toHaveCount(0)
      await expect(qualified.getByRole('link')).toHaveCount(0)
    }
    for (const resource of await timeline.getByRole('link').all()) {
      await expect(resource).toHaveAttribute('target', '_blank')
      await expect(resource).toHaveAttribute('rel', /noopener/u)
      await expect(resource).toHaveAttribute('rel', /noreferrer/u)
    }

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

  test('topic captions connect each subject to relevant reading in the same tab', async ({ browserName, page, request }) => {
    const topics = page.locator('[data-talk-card="topic"]')
    const sources = topics.getByRole('link')
    await expect(sources).toHaveText([
      'Standards that scale',
      'Measuring developer experience',
      'Structuring React projects',
      'Automating quality checks',
      'Building a family platform',
      'Growing ReactJS Colombia'
    ])
    const paths = [
      '/blog/code-standards-that-scale-with-a-team/',
      '/blog/why-developer-experience-work-should-be-measured-like-product-work/',
      '/blog/atomic-module-component-structure-for-react/',
      '/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/',
      '/blog/building-aaronmgz-as-a-family-platform/',
      '/portfolio/react-js-colombia/'
    ] as const

    for (const [index, path] of paths.entries()) {
      const card = topics.nth(index)
      const source = card.getByRole('link')
      await expect(card).toContainText('Read the approach')
      await expect(source).toHaveAttribute('href', path)
      await expect(source).not.toHaveAttribute('target', '_blank')
      expect((await request.get(path)).status()).toBe(200)
    }
    await expect(page.locator('[data-talk-card="format"] [data-talk-source]')).toHaveCount(0)

    await sources.first().focus()
    await expect(sources.first()).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(sources.nth(1)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(paths[1])
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Why Developer Experience Work Should Be Measured Like Product Work')
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

  test('format outcome captions lead to the booking brief with the keyboard', async ({ browserName, page }) => {
    const cards = page.locator('[data-talk-card="format"]')
    const links = cards.getByRole('link')
    await expect(links).toHaveText(['Plan a meetup', 'Plan a workshop', 'Plan a team session', 'Plan a panel'])
    await expect(cards.locator('[data-talk-fit]')).toHaveText([
      'Introduce an idea and open a conversation.',
      'Practice a technique with your team.',
      'Build a shared approach to an engineering challenge.',
      'Explore perspectives and questions with your audience.'
    ])
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('href', '#speaking-booking-heading')
      await expect(link).not.toHaveAttribute('target', '_blank')
    }
    await links.first().scrollIntoViewIfNeeded()
    await links.first().focus()
    await expect(links.first()).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(links.nth(1)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/speaking/#speaking-booking-heading')
    await expect(page.locator('#speaking-booking-heading')).toBeInViewport()
    await expect(page.getByRole('link', { name: 'Message on WhatsApp', exact: true })).toBeInViewport()
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page.locator('[data-speaking-hero]').getByRole('link', { name: 'Plan a session', exact: true })).toBeVisible()
      await waitForVisibleAnimations(page)
      await expect(page).toHaveScreenshot('speaking-page.png')
    })
  }
})
