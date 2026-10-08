import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('Blog page', () => {
  test('index should have the correct title and list posts', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page).toHaveTitle(/Blog/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Ensure at least one blog post is listed
    const postLinks = page.locator('article a')
    await expect(postLinks.first()).toBeVisible()
  })

  test('latest preview and writing shortcut lead into the chronological feed', async ({ page }) => {
    await page.goto('/blog/')

    const latest = page.locator('[data-blog-latest] a')
    const firstPost = page.locator('[data-post-gallery-card] a').first()
    await expect(latest).toHaveAttribute('href', /^\/blog\/.+\/$/u)
    const latestHref = requireValue(await latest.getAttribute('href'))

    await expect(firstPost).toHaveAttribute('href', latestHref)
    await page.getByRole('link', { name: 'Explore the writing' }).click()
    await expect(page).toHaveURL(/#posts$/)
    await expect(page.locator('#posts')).toBeInViewport()

    await latest.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${latestHref}$`))
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('personal topics lead to their posts and preserve navigation back to the mixed feed', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page).toHaveTitle(/Personal Blog/)

    const filter = page.getByRole('group', { name: 'Filter by topic' })
    await filter.getByRole('link', { name: /reading/i }).click()
    await expect(page).toHaveURL(/\/blog\/tags\/reading\//)
    await expect(page.locator('[data-post-gallery-card]')).toContainText('International Firmware')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Articles, guides, and personal notes tagged reading\./)

    await filter.getByRole('link', { name: /gaming/i }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/gaming\//)
    await expect(page.locator('[data-post-gallery-card]')).toContainText('R.E.P.O.')

    await filter.getByRole('link', { name: 'All posts' }).click()
    await expect(page).toHaveURL(/\/blog\/$/)
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)
  })

  test('renders twelve visual posts consistently on every full archive page', async ({ page }) => {
    await page.goto('/blog/')

    await expect(page.locator('[data-post-gallery-featured]')).toHaveCount(0)
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)

    await page.goto('/blog/2/')

    await expect(page.locator('[data-post-gallery-featured]')).toHaveCount(0)
    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)
  })

  test('long mobile archives keep every article visible with motion enabled', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    for (const route of ['/blog/', '/blog/2/', '/blog/3/', '/blog/tags/developer-experience/', '/blog/tags/typescript/', '/blog/series/the-santi020k-way/']) {
      await page.goto(route)
      const cards = page.locator('[data-post-gallery-card]')

      expect(await cards.count()).toBeGreaterThanOrEqual(12)

      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded()
        await expect(card).toBeInViewport()
        await expect(card).toHaveCSS('opacity', '1')
      }
    }
  })

  test('mobile article headings wrap completely without clipping', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 })
    await page.goto('/blog/3/')

    const headings = page.locator('[data-post-gallery-card] h3')
    await expect(headings).toHaveCount(12)

    for (const heading of await headings.all()) {
      const bounds = await heading.evaluate(element => ({
        available: element.clientHeight,
        content: element.scrollHeight
      }))

      expect(bounds.content).toBeLessThanOrEqual(bounds.available + 1)
      await expect(heading).toHaveCSS('-webkit-line-clamp', 'none')
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  })

  test('pagination links keep the trailing slash so no host redirect is needed', async ({ page }) => {
    for (const route of ['/blog/', '/blog/2/', '/blog/tags/typescript/']) {
      await page.goto(route)

      const pagination = page.getByRole('navigation', { name: 'Pagination' })
      const hrefs = await pagination.getByRole('link').evaluateAll(
        links => links.map(link => link.getAttribute('href') ?? '')
      )

      expect(hrefs.length).toBeGreaterThan(0)
      expect(hrefs.filter(href => !href.endsWith('/'))).toEqual([])
    }
  })

  test('pagination exposes prev and next relationships and never hides a single page', async ({ page }) => {
    await page.goto('/blog/2/')

    const pagination = page.getByRole('navigation', { name: 'Pagination' })

    await expect(pagination.locator('a[rel="prev"]')).toHaveAttribute('href', '/blog/')
    await expect(pagination.locator('a[rel="next"]')).toHaveAttribute('href', '/blog/3/')

    // A four-page archive fits without an ellipsis standing in for one number.
    await expect(pagination.getByText('…')).toHaveCount(0)
    await expect(pagination.getByRole('link', { exact: true, name: 'Page 3' })).toBeVisible()
  })

  test('topic and series archives reuse the visual post gallery', async ({ page }) => {
    await page.goto('/blog/tags/developer-experience/')

    await expect(page.locator('[data-post-gallery-card]')).toHaveCount(12)
    await expect(page.locator('[data-post-card]')).toHaveCount(0)

    await page.goto('/blog/series/the-santi020k-way/')

    await expect(page.locator('[data-post-gallery-card]').first()).toBeVisible()
    await expect(page.locator('[data-post-gallery-card]').first()).toContainText('Part 1')
    await expect(page.locator('[data-post-card]')).toHaveCount(0)
  })

  test('index should pass accessibility audit', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test('index remains accessible in the dark theme on mobile', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/blog/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expectNoUnexpectedAccessibilityViolations(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  })

  test('index search should return matching content links', async ({ page }) => {
    await page.goto('/blog/')

    await page.getByRole('button', { name: 'Open site search' }).click()
    const input = page.locator('#site-search-input')
    await input.fill('eslint')

    const results = page.locator('#site-search-results li a')
    await expect(results.first()).toBeVisible()
    await expect(results.first()).toHaveAttribute('href', /\/blog\/|\/portfolio\//)
  })

  test('search arrow-key navigation announces the highlighted result to screen readers', async ({ page }) => {
    await page.goto('/blog/')

    await page.getByRole('button', { name: 'Open site search' }).click()
    const input = page.locator('#site-search-input')
    await input.fill('typescript')

    const results = page.locator('#site-search-results li a')
    await expect(results.nth(1)).toBeVisible()

    const resultCount = await results.count()
    expect(resultCount).toBeGreaterThanOrEqual(2)

    // Typing already auto-selects the first result; one ArrowDown moves to the second.
    const secondTitle = await results.nth(1).locator('[data-site-search-result-title]').innerText()

    await input.press('ArrowDown')

    const status = page.locator('#site-search-status')
    await expect(status).toHaveText(`${secondTitle}, 2 of ${resultCount}`)
    await expect(results.nth(1)).toHaveAttribute('data-site-search-active', 'true')
    await expect(input).toBeFocused()

    const firstTitle = await results.first().locator('[data-site-search-result-title]').innerText()

    await input.press('ArrowUp')
    await expect(status).toHaveText(`${firstTitle}, 1 of ${resultCount}`)
  })

  if (shouldRunVisualSnapshots) {
    test('index should match visual snapshot', async ({ page }) => {
      await page.goto('/blog/')
      await expect(page).toHaveScreenshot('blog-index.png')
    })
  }

  test('single post page should load correctly', async ({ page }) => {
    // Navigating to a known post slug
    const slug = 'atomic-module-component-structure-for-react'
    await page.goto(`/blog/${slug}/`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main article').first()).toBeVisible()

    // Post content accessibility audit
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  if (shouldRunVisualSnapshots) {
    test('single post page should match visual snapshot', async ({ page }) => {
      const slug = 'atomic-module-component-structure-for-react'
      await page.goto(`/blog/${slug}/`)
      await expect(page).toHaveScreenshot('blog-post.png')
    })
  }
})
