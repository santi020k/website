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

  test('should derive its two totals from the visible series', async ({ page }) => {
    const cards = page.locator('[data-series-card]')
    const counts = await cards.locator('[data-series-card-meta] > span:last-child').allTextContents()
    const articles = counts.reduce((total, label) => total + Number.parseInt(label, 10), 0)
    const totals = page.locator('[data-series-index-totals]')

    await expect(totals.locator('dt')).toHaveText(['Active series', 'Articles to explore'])
    await expect(totals.locator('dd')).toHaveText([String(await cards.count()), String(articles)])
    await expect(page.locator('[data-stats-section]')).toHaveCount(0)
  })

  test('should render at least one series card', async ({ page }) => {
    const seriesSection = page.getByRole('heading', { name: 'Choose a series', exact: true })
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

for (const locale of ['en', 'es'] as const) {
  const prefix = locale === 'es' ? '/es' : ''
  const heading = locale === 'es' ? 'Series del blog. Sigue el hilo.' : 'Blog series. Follow the thread.'

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} reading brief preserves hierarchy and reflows in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`${prefix}/blog/series/`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
      await expect(page.locator('[data-series-index-totals] dt')).toHaveText(locale === 'es' ? ['Series activas', 'Artículos para explorar'] : ['Active series', 'Articles to explore'])
      const destinations = await page.locator('[data-series-card] a').evaluateAll(links => links.map(link => link.getAttribute('href')))

      for (const [width, size, sideBySide] of [[1440, '100%', true], [768, '100%', true], [390, '100%', false], [320, '200%', false]] as const) {
        await page.setViewportSize({ width, height: 1100 })
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        const geometry = await page.locator('[data-series-index-spread]').evaluate(element => {
          const intro = element.firstElementChild?.getBoundingClientRect()
          const totals = element.querySelector('dl')?.getBoundingClientRect()
          if (!intro || !totals) throw new Error('Missing Series brief columns')

          return {
            sideBySide: totals.left > intro.right,
            stacked: totals.top > intro.bottom,
            fits: [...element.querySelectorAll('h1,p,dt,dd')].every(copy => copy.scrollWidth <= copy.clientWidth + 1)
          }
        })
        expect(geometry.sideBySide).toBe(sideBySide)
        expect(geometry.stacked).toBe(!sideBySide)
        expect(geometry.fits).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
      expect(await page.locator('[data-series-card] a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(destinations)
      await expectNoUnexpectedAccessibilityViolations(page)
      const back = page.locator('[data-series-index-return]')
      await back.focus()
      await expect(back).toHaveCSS('outline-style', 'solid')
      await back.press('Enter')
      await expect(page).toHaveURL(`${prefix}/blog/`)
    })
  }

  test.describe(`${locale} reading brief without JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test('keeps the totals and native series destination available', async ({ page }) => {
      await page.goto(`${prefix}/blog/series/`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
      await expect(page.locator('[data-series-index-totals] dd')).toHaveText(['3', '27'])
      const first = page.locator('[data-series-card] a').first()
      const href = await first.getAttribute('href')
      expect(href).toMatch(new RegExp(`^${prefix}/blog/series/[^/]+/$`, 'u'))
      await first.press('Enter')
      await expect(page).toHaveURL(href ?? '')
    })
  })
}

const seriesHeadings = [
  { route: '/blog/series/building-a-production-nextjs-app/', heading: 'Building a Production Next.js App.' },
  { route: '/blog/series/eslint-in-practice/', heading: 'ESLint in Practice.' },
  { route: '/blog/series/the-santi020k-way/', heading: 'The santi020k way.' }
]

for (const { route, heading } of seriesHeadings) {
  test(`series heading preserves the complete title on ${route}`, async ({ page }) => {
    await page.goto(route)

    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(heading)
  })
}

for (const route of ['/blog/', '/blog/series/']) {
  test(`series cards separate their reading track and first article on ${route}`, async ({ page }) => {
    await page.goto(route)
    const cards = page.locator('[data-series-card]')

    expect(await cards.count()).toBeGreaterThan(0)
    for (const card of await cards.all()) {
      await expect(card.getByRole('link')).toHaveCount(2)
      await expect(card.locator('[data-series-card-link]')).toHaveAccessibleName(/Explore the \d+ articles/u)
      await expect(card.locator('[data-series-card-start]')).toHaveAccessibleName(/Start with article 1/u)
      await expect(card.getByRole('list', { name: 'Focus areas' })).toBeVisible()
    }
    const card = cards.first()
    const title = await card.getByRole('heading').innerText()
    const link = card.locator('[data-series-card-link]')
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
