import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const searchEntries = Array.from({ length: 12 }, (_, index) => ({
  title: `Astro guide ${index + 1}`,
  description: 'Practical notes on building accessible websites, reliable navigation, and reusable interfaces.',
  path: `/blog/astro-guide-${index + 1}/`,
  tags: ['Astro', 'Accessibility', 'developer-experience', 'TypeScript', 'ESLint', 'JavaScript', 'Testing', 'CI-CD'],
  type: 'post' as const
}))

const viewports = [
  ...[320, 375, 535, 1440].flatMap(width => [16, 20].map(fontSize => ({ width, height: 900, fontSize }))),
  { width: 667, height: 375, fontSize: 16 }
]

for (const { width, height, fontSize } of viewports) {
  test(`search stays usable at ${width}x${height} with ${fontSize}px text`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/search-index.json', route => route.fulfill({ json: searchEntries }))
    await page.goto('/')
    await page.evaluate(size => {
      document.documentElement.style.fontSize = `${size}px`
    }, fontSize)
    await page.locator('[data-site-search-trigger]').click()
    await expect(page.locator('[data-site-search-suggestion]')).toHaveCount(8)

    const panel = page.locator('[data-site-search-panel]')
    const input = page.locator('#site-search-input')
    const close = page.locator('[data-site-search-close]')
    const footer = page.locator('[data-site-search-footer]')

    await expect(input).toBeFocused()
    await expect(close).toBeInViewport({ ratio: 1 })
    await expect(footer).toBeInViewport({ ratio: 1 })
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)

    await input.fill('Astro')
    const results = page.locator('[data-site-search-result]')

    await expect(results).toHaveCount(8)
    await expect(page.locator('[data-site-search-input-clear]')).toBeVisible()
    await results.last().scrollIntoViewIfNeeded()
    await expect(results.last()).toBeInViewport({ ratio: 1 })
    await expect(footer).toBeInViewport({ ratio: 1 })
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  })
}

for (const theme of ['light', 'dark']) {
  test(`search suggestions and results are accessible in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.route('**/search-index.json', route => route.fulfill({ json: searchEntries }))
    await page.goto('/')
    await page.locator('[data-site-search-trigger]').click()
    await expect(page.locator('[data-site-search-suggestion]')).toHaveCount(8)
    expect((await new AxeBuilder({ page }).include('#site-search-dialog').analyze()).violations).toEqual([])
    await page.locator('[data-site-search-suggestion]').filter({ hasText: 'Astro' }).click()
    await expect(page.locator('#site-search-input')).toHaveValue('Astro')
    await expect(page.locator('[data-site-search-result]')).toHaveCount(8)
    expect((await new AxeBuilder({ page }).include('#site-search-dialog').analyze()).violations).toEqual([])
  })
}

test('search recovery controls restore results and clear empty queries', async ({ page }) => {
  let requests = 0

  await page.route('**/search-index.json', route => {
    requests += 1

    return requests === 1 ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.fulfill({ json: searchEntries })
  })
  await page.goto('/')
  await page.locator('[data-site-search-trigger]').click()
  await expect(page.locator('#site-search-results')).toContainText('Search unavailable')
  await page.locator('[data-site-search-retry]').click()
  await expect(page.locator('[data-site-search-suggestion]')).toHaveCount(8)
  await page.locator('#site-search-input').fill('unmatched-query')
  await expect(page.locator('#site-search-results')).toContainText('No results found')
  await page.locator('[data-site-search-clear]').click()
  await expect(page.locator('#site-search-input')).toBeFocused()
  await expect(page.locator('[data-site-search-suggestion]')).toHaveCount(8)
})

test('recent search suggestions keep their readable label and restore the query', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('site-search-recent', JSON.stringify(['Astro']))
  })
  await page.route('**/search-index.json', route => route.fulfill({ json: searchEntries }))
  await page.goto('/')
  await page.locator('[data-site-search-trigger]').click()
  await expect(page.locator('[data-site-search-group-title]')).toHaveText('Recent searches')
  await expect(page.locator('[data-site-search-suggestion]')).toHaveAccessibleName('Astro')
  await page.locator('[data-site-search-suggestion]').click()
  await expect(page.locator('#site-search-input')).toHaveValue('Astro')
  await expect(page.locator('[data-site-search-result]')).toHaveCount(8)
})
