import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const LATEST = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const PREVIOUS = '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/'
const FIRST = '/blog/atomic-module-component-structure-for-react/'
const SERIES = '/blog/series/building-a-production-nextjs-app/'

test.beforeEach(async ({ page }) => {
  await page.route('https://giscus.app/**', route => route.abort())
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test.describe('Series close without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the latest published chapter offers an earlier chapter and the full series', async ({ page, browserName }) => {
    await page.goto(LATEST)
    const section = page.locator('#series-navigation')
    const previous = section.getByRole('link', { name: /Previous in series/u })
    const summary = section.locator('summary')

    await expect(section.getByRole('heading', { level: 2 })).toHaveText('At the latest chapter.')
    await expect(section).toContainText('Latest published chapter')
    await expect(section).toContainText('Post 8 of 8')
    await expect(section.getByRole('link', { name: /Next in series/u })).toHaveCount(0)
    await expect(previous).toHaveAttribute('href', PREVIOUS)
    await expect(previous).toHaveAttribute('rel', 'prev')
    await expect(previous).toContainText('Part 07')
    await expect(section.locator('[data-series-navigator-title]')).toHaveAttribute('href', SERIES)
    await expect(section.getByRole('link', { name: 'Explore the series' })).toHaveAttribute('href', SERIES)
    await expect(section.locator('details')).not.toHaveAttribute('open')

    await previous.focus()
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(summary).toBeFocused()
    await expect(summary).toHaveCSS('outline-style', 'solid')
    await summary.press('Enter')
    const chapters = section.getByRole('navigation', { name: 'Chapters in Building a Production Next.js App' })

    await expect(chapters.getByRole('link')).toHaveCount(8)
    await expect(chapters.locator('[aria-current="step"]')).toHaveAttribute('href', LATEST)
    await summary.press('Enter')
    await expect(chapters).toBeHidden()
    await previous.press('Enter')
    await expect(page).toHaveURL(PREVIOUS)
    await expect(page.locator('#series-navigation').getByRole('link', { name: /Next in series/u })).toHaveAttribute('href', LATEST)
  })

  test('first and middle chapters retain their continuation heading and destinations', async ({ page }) => {
    for (const path of [FIRST, PREVIOUS]) {
      await page.goto(path)
      const section = page.locator('#series-navigation')

      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Building a Production Next.js App')
      await expect(section).toContainText('Continue the series')
      await expect(section).not.toContainText('Latest published chapter')
      await expect(section.getByRole('link', { name: /Next in series/u })).toHaveCount(1)
      await expect(section.getByRole('link', { name: /Previous in series/u })).toHaveCount(path === FIRST ? 0 : 1)
    }
  })
})

for (const theme of ['light', 'dark']) {
  test(`Series close reflows with enlarged text and remains accessible in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto(LATEST)
    const section = page.locator('#series-navigation')
    const previous = section.getByRole('link', { name: /Previous in series/u })

    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const textSize of ['100%', '200%']) {
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = value
          await document.fonts.ready
        }, textSize)
        await previous.focus()
        await expect(previous).toHaveCSS('outline-style', 'solid')
        for (const element of await section.locator('h2, h3, [data-series-navigator-title], [data-series-close-meta]').all()) {
          expect(await element.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
        }
        const bounds = requireValue(await previous.boundingBox())

        expect(bounds.x).toBeGreaterThanOrEqual(4)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width - 4)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expect(previous.locator('h3')).toHaveCSS('transition-property', 'none')
    const focusedColor = await previous.locator('h3').evaluate(node => getComputedStyle(node).color)

    await previous.evaluate(node => {
      node.blur()
    })
    await previous.hover()
    await expect(previous.locator('h3')).toHaveCSS('color', focusedColor)
    expect((await new AxeBuilder({ page }).include('#series-navigation').analyze()).violations).toEqual([])
    await section.locator('summary').click()
    expect((await new AxeBuilder({ page }).include('#series-navigation').analyze()).violations).toEqual([])
  })
}
