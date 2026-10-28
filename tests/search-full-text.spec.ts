import { expect, test } from '@playwright/test'

const entries = [
  { title: 'Primary guide', path: '/about/', description: 'A primary match.', tags: [], type: 'post' },
  { title: 'Body guide', path: '/work/', description: 'Separate details.', tags: [], type: 'project' }
]

test.beforeEach(async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('appends body matches once while retaining primary results and native keyboard navigation', async ({ page }) => {
  await page.route('**/pagefind/pagefind.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `export async function debouncedSearch() { return { results: [
      { data: async () => ({ url: '/about/', plain_excerpt: 'Duplicate' }) },
      { data: async () => ({ url: '/work/index.html', plain_excerpt: 'A primary body mention &amp; context.' }) },
      { data: async () => ({ url: '//evil.example/work/', plain_excerpt: 'External' }) }
    ] } }`
  }))
  await page.goto('/?q=primary')

  const results = page.locator('#site-search-results')

  await expect(results).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('[data-site-search-result]')).toHaveCount(2)
  await expect(page.locator('[data-site-search-full-text]')).toHaveText('Mentioned in')
  await expect(results).toContainText('A primary body mention & context.')
  await page.locator('#site-search-input').press('ArrowDown')
  await page.locator('#site-search-input').press('Enter')
  await expect(page).toHaveURL(/\/work\/$/u)
})

test('settles a lazy chunk failure without page errors and retains primary matches', async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/pagefind/pagefind.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'export async function debouncedSearch() { throw new Error("chunk unavailable") }'
  }))
  await page.goto('/?q=primary')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('[data-site-search-result]')).toHaveCount(1)
  await expect(page.locator('#site-search-status')).toHaveText('1 result available. Use arrow keys to navigate.')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-content-unavailable', '')
  expect(errors).toEqual([])
})

test('stale responses cannot replace newer queries or enter a new page', async ({ page }) => {
  await page.route('**/pagefind/pagefind.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `export async function debouncedSearch(query) {
      await new Promise(resolve => setTimeout(resolve, query === 'older' ? 700 : 20));
      if (query === 'older') document.documentElement.dataset.oldSearchComplete = 'true';
      return { results: [{ data: async () => ({ url: '/work/', plain_excerpt: query }) }] };
    }`
  }))
  await page.goto('/?q=older')
  const input = page.locator('#site-search-input')

  await input.fill('newer')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('[data-site-search-result-description]')).toHaveText('newer')
  await expect(page.locator('html')).toHaveAttribute('data-old-search-complete', 'true')
  await expect(page.locator('[data-site-search-result-description]')).toHaveText('newer')
  await input.fill('older')
  await input.press('Escape')
  await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL(/\/about\/$/u)
  await expect(page.locator('#site-search-results')).toBeEmpty()
})

test('content search stays lazy and the production index includes only current published bodies', async ({ page }) => {
  let requests = 0

  await page.unroute('**/search-index.json')
  page.on('request', request => {
    if (request.url().includes('/pagefind/')) requests += 1
  })
  await page.goto('/')
  expect(requests).toBe(0)
  await page.locator('[data-site-search-trigger]').click()
  expect(requests).toBe(0)
  await page.locator('#site-search-input').fill('changesets')
  await expect(page.locator('#site-search-results')).toHaveAttribute('data-site-search-state', 'settled')
  await expect(page.locator('[data-site-search-full-text]')).toHaveCount(1)
  const hrefs = await page.locator('[data-site-search-result]').evaluateAll(links => links.map(link => link.getAttribute('href')))

  expect(hrefs.every(href => typeof href === 'string' && /^\/(?:blog|portfolio)\//u.test(href))).toBe(true)
  expect(requests).toBeGreaterThan(0)
})
