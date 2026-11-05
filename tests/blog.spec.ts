import { expect, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

const SLEEVED_CARD = '.series-detail-page [data-post-gallery-grid="chapters"] [data-post-gallery-card]'

interface ArchivePage {
  canonical: string | null
  description: string | null
  path: string
}

/** Follows rel="next" from the first archive page so totals are never hard-coded. */
const collectArchivePages = async (page: Page, firstPath: string) => {
  const pages: ArchivePage[] = []
  let path: string | null = firstPath

  while (path) {
    if (pages.some(archivePage => archivePage.path === path)) throw new Error(`Archive pagination cycle at ${path}`)

    await page.goto(path)

    pages.push({
      canonical: await page.locator('link[rel="canonical"]').getAttribute('href'),
      description: await page.locator('meta[name="description"]').getAttribute('content'),
      path
    })

    const next = page.getByRole('navigation', { name: 'Pagination' }).locator('a[rel="next"]')

    path = await next.count() ? await next.getAttribute('href') : null
  }

  return pages
}

const findPagedTopic = async (page: Page, tagPaths: string[]): Promise<string> => {
  for (const tagPath of tagPaths) {
    const response = await page.request.get(tagPath)

    if ((await response.text()).includes('rel="next"')) return tagPath
  }

  throw new Error('No topic archive spans multiple pages')
}

const expectPagedDescriptions = (pages: ArchivePage[]) => {
  const [first, ...rest] = pages
  const baseDescription = requireValue(first?.description)

  expect(rest.length, 'archive should span more than one page').toBeGreaterThan(0)
  expect(baseDescription).not.toMatch(/Page \d+ of \d+/u)

  for (const archivePage of pages) {
    expect(archivePage.canonical).toBe(new URL(archivePage.path, 'https://santi020k.com').href)
  }

  for (const [index, archivePage] of rest.entries()) {
    expect(archivePage.description).toBe(`${baseDescription} Page ${index + 2} of ${pages.length}.`)
  }

  expect(new Set(pages.map(archivePage => archivePage.description)).size).toBe(pages.length)
}

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
    await expect(latest).toHaveCount(1)
    const latestDescription = requireValue(await latest.locator('[data-latest-description]').textContent())
    await expect(latest.locator('[data-latest-description]')).toHaveCSS('-webkit-line-clamp', 'none')
    const firstPost = page.locator('[data-post-gallery-card] a').first()
    await expect(latest).toHaveAttribute('href', /^\/blog\/.+\/$/u)
    const latestHref = requireValue(await latest.getAttribute('href'))

    await expect(firstPost).toHaveAttribute('href', latestHref)
    await page.getByRole('link', { name: 'Explore the writing' }).press('Enter')
    await expect(page).toHaveURL(/#posts$/)
    await expect(page.locator('#posts')).toBeInViewport()

    await latest.focus()
    await expect(latest).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${latestHref}$`))
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', latestDescription)
  })

  test('personal topics lead to their posts and preserve navigation back to the mixed feed', async ({ page }) => {
    await page.goto('/blog/')
    await expect(page).toHaveTitle(/Personal Blog/)

    const filter = page.getByRole('group', { name: 'Filter by topic' })
    await filter.getByRole('link', { name: /reading/i }).click()
    await expect(page).toHaveURL(/\/blog\/tags\/reading\//)
    await expect(page.locator('[data-post-gallery-card]')).toContainText('International Firmware')
    // Topic archives reuse their visible note as the page description.
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      await page.locator('[data-topic-archive-description]').innerText()
    )

    await page.locator('[data-topic-archive-blog]').click()
    await expect(page).toHaveURL(/\/blog\/$/)
    await filter.getByRole('link', { name: /gaming/i }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/gaming\//)
    await expect(page.locator('[data-post-gallery-card]')).toContainText('R.E.P.O.')

    await page.locator('[data-topic-archive-blog]').click()
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

  test('editorial cards keep a single reading link and complete content in every gallery', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    for (const route of ['/blog/', '/blog/tags/typescript/', '/blog/series/the-santi020k-way/', '/developer-experience/', '/blog/atomic-module-component-structure-for-react/']) {
      await page.goto(route)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      const cards = page.locator('[data-post-gallery-card]')

      expect(await cards.count()).toBeGreaterThan(0)
      for (const card of await cards.all()) {
        const link = card.getByRole('link')

        await expect(link).toHaveCount(1)
        await expect(link).toHaveAccessibleName(/Read article.*min read/u)
        await expect(card.locator('[data-post-gallery-meta] time')).toHaveAttribute('datetime', /^\d{4}-/u)
        await expect(card.locator('[data-post-gallery-footer]')).toContainText('Read article')
        for (const text of await card.locator('h3, p, li, [data-post-gallery-footer] > span').all()) {
          await expect(text).toHaveCSS('-webkit-line-clamp', 'none')
          const overflow = await text.evaluate(element => {
            const horizontal = element.scrollWidth > element.clientWidth + 1
            const vertical = element.scrollHeight > element.clientHeight + 1

            return horizontal || vertical
          })

          expect(overflow).toBe(false)
        }
      }
      // Series chapters sit in sculpted sleeves; every other gallery keeps its cards open.
      for (const card of await page.locator(`[data-post-gallery-card]:not(${SLEEVED_CARD})`).all()) {
        await expect(card).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      }
      for (const card of await page.locator(SLEEVED_CARD).all()) {
        await expect(card).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
    }
  })

  test('editorial artwork stays still on hover and card copy preserves the article description', async ({ page }) => {
    await page.goto('/blog/')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const card = page.locator('[data-post-gallery-card]').filter({
      has: page.locator('a[href="/blog/open-sourcing-santi020k-auth-cloudflare/"]')
    })
    const image = card.locator('img')

    await card.scrollIntoViewIfNeeded()
    const originalBounds = await image.boundingBox()

    await card.hover()
    await expect(image).toHaveCSS('transform', 'none')
    expect(await image.boundingBox()).toEqual(originalBounds)
    await expect(card.locator('p')).toHaveText('A reusable authentication foundation for Cloudflare apps, with email codes, passkeys, and separate accounts for every product.')
    await card.getByRole('link').click()
    await expect(page).toHaveURL(/\/blog\/open-sourcing-santi020k-auth-cloudflare\/$/u)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Why I made @santi020k\/auth-cloudflare public/u)
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

  test('pagination endpoints keep placeholders decorative and links labelled', async ({ page }) => {
    const archivePages = await collectArchivePages(page, '/blog/')
    const lastPath = requireValue(archivePages.at(-1)?.path)

    await page.goto('/blog/')

    let pagination = page.getByRole('navigation', { name: 'Pagination' })

    await expect(pagination.locator('a[rel="prev"]')).toHaveCount(0)
    await expect(pagination.locator('[data-pagination-placeholder="previous"]')).toHaveAttribute('aria-hidden', 'true')
    await expect(pagination.locator('[data-pagination-placeholder]:not([aria-hidden="true"])')).toHaveCount(0)
    await expect(pagination.locator('[data-pagination-placeholder][aria-label]')).toHaveCount(0)
    await expect(pagination.locator('a[rel="next"]')).toHaveAttribute('aria-label', 'Next page')
    await expect(pagination.getByRole('link', { exact: true, name: 'Page 1' })).toHaveAttribute('aria-current', 'page')

    await page.goto(lastPath)
    pagination = page.getByRole('navigation', { name: 'Pagination' })

    await expect(pagination.locator('a[rel="next"]')).toHaveCount(0)
    await expect(pagination.locator('[data-pagination-placeholder="next"]')).toHaveAttribute('aria-hidden', 'true')
    await expect(pagination.locator('[data-pagination-placeholder][aria-label]')).toHaveCount(0)
    await expect(pagination.locator('a[rel="prev"]')).toHaveAttribute('aria-label', 'Previous page')
    await expect(pagination.getByRole('link', { exact: true, name: `Page ${archivePages.length}` }))
      .toHaveAttribute('aria-current', 'page')
  })

  test('later blog archive pages describe their position without changing canonicals', async ({ page }) => {
    const pages = await collectArchivePages(page, '/blog/')

    expect(pages.length).toBeGreaterThan(1)
    expectPagedDescriptions(pages)
  })

  test('later topic archive pages describe their position without changing canonicals', async ({ page }) => {
    await page.goto('/blog/tags/')

    const tagPaths = await page.locator('main a[href^="/blog/tags/"]').evaluateAll(
      links => [...new Set(links.map(link => link.getAttribute('href') ?? ''))]
        .filter(href => /^\/blog\/tags\/[^/]+\/$/u.test(href))
    )

    const pages = await collectArchivePages(page, await findPagedTopic(page, tagPaths))

    expect(pages.length).toBeGreaterThan(1)
    expectPagedDescriptions(pages)
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
