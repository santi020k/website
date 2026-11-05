import { expect, type Page, test } from '@playwright/test'

const entries = [
  { title: 'Astro guide', description: 'Practical notes.', path: '/about/', tags: ['Astro'], type: 'post' }
]
const recentKey = 'site-search-recent'

const navigateToAbout = async (page: Page) => {
  const menuToggle = page.locator('[data-mobile-nav-toggle]')

  if (await menuToggle.isVisible()) await menuToggle.click()
  await page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /About$/u }).click()
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

for (const { query, motion } of [
  { query: '', motion: 'reduce' },
  { query: 'a', motion: 'reduce' },
  { query: '', motion: 'no-preference' },
  { query: 'a', motion: 'no-preference' }
] as const) {
  test(`same-document Back dismisses search with ${query ? 'a short query' : 'no query'} and ${motion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion })
    await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
    await page.goto('/?source=history')
    await page.locator('a[href="#main"]').first().focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/\?source=history#main$/u)
    await page.keyboard.press('Control+k')
    await page.locator('#site-search-input').fill(query)
    await expect(page.locator('#site-search-status')).toHaveText('1 popular topics available.')

    await page.goBack()
    await expect(page).toHaveURL(/\/\?source=history$/u)
    await expect(page.locator('#site-search-dialog')).toBeHidden()
    await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
    await expect(page.locator('html')).not.toHaveClass(/site-search-open/u)
    await expect(page.locator('body')).not.toHaveClass(/site-search-open/u)
    await page.goForward()
    await expect(page).toHaveURL(/\/\?source=history#main$/u)
    await expect(page.locator('#site-search-dialog')).toBeHidden()
  })
}

test('same-document history preserves a searchable deep link', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
  await page.goto('/?source=history&q=Astro')
  await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
  await page.evaluate(() => {
    window.location.hash = 'main'
  })
  await expect(page).toHaveURL(/\/\?source=history&q=Astro#main$/u)
  await page.keyboard.press('Control+k')
  await page.goBack()
  await expect(page).toHaveURL(/\/\?source=history&q=Astro$/u)
  await expect(page.locator('#site-search-dialog')).toBeVisible()
  await expect(page.locator('#site-search-input')).toHaveValue('Astro')
  await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
  await page.goForward()
  await expect(page).toHaveURL(/\/\?source=history&q=Astro#main$/u)
  await expect(page.locator('#site-search-dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/\?source=history#main$/u)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
})

test('rapid fragment Back and Forward finish closing with an accurate trigger state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
  await page.goto('/?source=history')
  await page.locator('a[href="#main"]').first().focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Control+k')
  await expect(page.locator('#site-search-status')).toHaveText('1 popular topics available.')
  await page.evaluate(() => new Promise<void>(resolve => {
    window.addEventListener('popstate', () => {
      window.addEventListener('popstate', () => {
        resolve()
      }, { once: true })
      window.history.forward()
    }, { once: true })
    window.history.back()
  }))
  await expect(page).toHaveURL(/\/\?source=history#main$/u)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  await expect(page.locator('html')).not.toHaveClass(/site-search-open/u)
  await expect(page.locator('body')).not.toHaveClass(/site-search-open/u)
})

test('fragment Back after typing a query closes search and Forward restores the query', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
  await page.goto('/?source=history')
  await page.locator('a[href="#main"]').first().focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Control+k')
  await page.locator('#site-search-input').fill('Astro')
  await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
  await page.goBack()
  await expect(page).toHaveURL(/\/\?source=history$/u)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('html')).not.toHaveClass(/site-search-open/u)
  await expect(page.locator('body')).not.toHaveClass(/site-search-open/u)
  await page.goForward()
  await expect(page).toHaveURL(/\/\?source=history&q=Astro#main$/u)
  await expect(page.locator('#site-search-dialog')).toBeVisible()
  await expect(page.locator('#site-search-input')).toHaveValue('Astro')
  await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
})

test('fragment Back preserves the destination query encoding', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
  await page.goto('/?source=history&ref=a%20b')
  await page.locator('a[href="#main"]').first().focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Control+k')
  await expect(page.locator('#site-search-status')).toHaveText('1 popular topics available.')
  await page.goBack()
  await expect(page).toHaveURL(/\/\?source=history&ref=a%20b$/u)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('html')).not.toHaveClass(/site-search-open/u)
  await expect(page.locator('body')).not.toHaveClass(/site-search-open/u)
})

test('a valid empty index stays cached when search reopens and after client navigation', async ({ page }) => {
  let requests = 0

  await page.route('**/search-index.json', route => {
    requests += 1

    return route.fulfill(requests === 1 ? { json: [] } : { status: 503, body: 'Unavailable' })
  })
  await page.goto('/?q=Astro')
  const status = page.locator('#site-search-status')
  const noMatches = 'No matching results for Astro. Try different keywords.'

  await expect(status).toHaveText(noMatches)
  await page.keyboard.press('Control+k')
  await expect(status).toHaveText(noMatches)
  await page.keyboard.press('Escape')
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  await page.keyboard.press('Meta+k')
  await expect(status).toHaveText(noMatches)
  await page.keyboard.press('Escape')

  await navigateToAbout(page)
  await expect(page).toHaveURL(/\/about\/$/u)
  await page.keyboard.press('Control+k')
  await expect(status).toHaveText('Type at least two characters to search.')
  await page.locator('#site-search-input').fill('Astro')
  await expect(status).toHaveText(noMatches)
  expect(requests).toBe(1)
})

test('saved suggestions reject unusable entries, deduplicate, and retain the five-query limit', async ({ page }) => {
  const saved = ['', ' \t ', 42, null, 'x', 'e\u0301', ' Astro ', 'astro', 'React', 'REACT', 'Node', 'CSS', 'HTML', 'Rust']
  const expected = ['Astro', 'React', 'Node', 'CSS', 'HTML']

  await page.addInitScript(({ key, values }) => {
    localStorage.setItem(key, JSON.stringify(values))
  }, { key: recentKey, values: saved })
  await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
  await page.goto('/')
  await page.locator('[data-site-search-trigger]').click()
  await expect(page.locator('#site-search-status')).toHaveText('5 recent searches available.')
  const suggestions = page.locator('[data-site-search-suggestion]')

  await expect(suggestions).toHaveCount(5)
  for (const [index, label] of expected.entries()) {
    await expect(suggestions.nth(index)).toHaveAccessibleName(label)
  }
  // Reading old data must not rewrite storage; choosing a result records the query.
  expect(await page.evaluate(key => localStorage.getItem(key), recentKey)).toBe(JSON.stringify(saved))
  await suggestions.first().click()
  const input = page.locator('#site-search-input')

  await expect(input).toHaveValue('Astro')
  await expect(input).toBeFocused()
  await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/about\/$/u)
  expect(await page.evaluate(key => localStorage.getItem(key), recentKey)).toBe(JSON.stringify(expected))
})

for (const { label, stored } of [
  { label: 'only unusable entries', stored: JSON.stringify(['', ' ', 'x', 'e\u0301', 42]) },
  { label: 'an object', stored: JSON.stringify({ query: 'Astro' }) },
  { label: 'invalid JSON', stored: '{' }
]) {
  test(`popular topics remain available when saved history contains ${label}`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => {
      localStorage.setItem(key, value)
    }, { key: recentKey, value: stored })
    await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
    await page.goto('/')
    await page.locator('[data-site-search-trigger]').click()
    await expect(page.locator('#site-search-status')).toHaveText('1 popular topics available.')
    const suggestion = page.locator('[data-site-search-suggestion]')

    await expect(suggestion).toHaveCount(1)
    await expect(suggestion).toHaveAccessibleName('Astro')
    await suggestion.click()
    await expect(page.locator('#site-search-input')).toHaveValue('Astro')
    await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
    expect(await page.evaluate(key => localStorage.getItem(key), recentKey)).toBe(stored)
  })
}

for (const operation of ['read', 'write'] as const) {
  test(`search navigation survives a blocked history ${operation}`, async ({ page }) => {
    await page.addInitScript(operation => {
      Storage.prototype[operation === 'read' ? 'getItem' : 'setItem'] = () => {
        throw new DOMException('Storage unavailable', operation === 'read' ? 'SecurityError' : 'QuotaExceededError')
      }
    }, operation)
    await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
    await page.goto('/')
    await page.locator('[data-site-search-trigger]').click()
    const input = page.locator('#site-search-input')

    await input.fill('Astro')
    await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/about\/$/u)
  })
}
