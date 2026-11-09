import { expect, test } from '@playwright/test'

test('search artwork does not repeat the result title in its accessible name', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ json: [{
    title: 'Astro guide',
    path: '/about/',
    description: 'Practical notes.',
    tags: [],
    type: 'post',
    coverUrl: '/favicon.webp'
  }] }))
  await page.goto('/?q=Astro')
  const result = page.locator('[data-site-search-result]')

  await expect(result).toHaveAccessibleName('Post Astro guide Practical notes.')
  await expect(result.locator('img')).toHaveAttribute('alt', '')
})

test('accent-insensitive queries find the real indexed entry while keeping the typed spelling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-site-search-trigger]').click()

  const input = page.locator('#site-search-input')
  const titles = page.locator('[data-site-search-result-title]')

  // The post's description spells the name "Aarón"; the title has no accent.
  for (const query of ['aaron', 'Aarón', 'Aarón'.normalize('NFD')]) {
    await input.fill(query)
    await expect(titles.filter({ hasText: 'Why I Built Between Contractions' })).toHaveCount(1)
    await expect(input).toHaveValue(query)
    expect(new URL(page.url()).searchParams.get('q')).toBe(query)
  }
})

// Every title contains "e", so a one-letter query that slipped past the
// minimum would list results instead of the typing hint.
const minimumLengthIndex = [
  { title: 'Effective engineering', path: '/about/', description: 'Every edge case.', tags: [], type: 'post' },
  { title: 'Élan notes', path: '/work/', description: 'Wood and texture.', tags: [], type: 'post' }
]

const oneLetterQueries = ['é', 'é'.normalize('NFD'), 'É'.normalize('NFD'), '́']

test('one-letter and mark-only queries stay below the minimum in any normalization form', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ json: minimumLengthIndex }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-site-search-trigger]').click()

  const input = page.locator('#site-search-input')
  const results = page.locator('[data-site-search-result]')

  for (const query of oneLetterQueries) {
    await input.fill(query)
    await expect(page.locator('#site-search-dialog').getByText('Start typing to search')).toBeVisible()
    await expect(results).toHaveCount(0)
    await expect(input).toHaveValue(query)
    expect(new URL(page.url()).searchParams.has('q')).toBe(false)
  }

  // Two letters, one decomposed, reach the index and keep the typed spelling.
  const twoLetters = 'éf'.normalize('NFD')

  await input.fill(twoLetters)
  await expect(results.filter({ hasText: 'Effective engineering' })).toHaveCount(1)
  await expect(input).toHaveValue(twoLetters)
  expect(new URL(page.url()).searchParams.get('q')).toBe(twoLetters)

  await input.press('Enter')
  await expect(page).toHaveURL(/\/about\/$/)
  expect(await page.evaluate(() => window.localStorage.getItem('site-search-recent'))).toBe(JSON.stringify([twoLetters]))
})

test('a one-letter deep link does not open search or request the index', async ({ page }) => {
  let requestCount = 0

  await page.route('**/search-index.json', async route => {
    requestCount += 1
    await route.fulfill({ json: minimumLengthIndex })
  })

  const dialog = page.locator('#site-search-dialog')

  // The module decides during evaluation, before `goto` resolves on load.
  for (const query of oneLetterQueries) {
    await page.goto(`/?q=${encodeURIComponent(query)}`)
    await expect(dialog).not.toHaveAttribute('open')
    expect(requestCount).toBe(0)
  }

  const twoLetters = 'éf'.normalize('NFD')

  await page.goto(`/?q=${encodeURIComponent(twoLetters)}`)
  await expect(dialog).toHaveAttribute('open')
  await expect(page.locator('#site-search-input')).toHaveValue(twoLetters)
  await expect(page.locator('[data-site-search-result]').filter({ hasText: 'Effective engineering' })).toHaveCount(1)
  expect(requestCount).toBe(1)
})

test('a delayed deep-link index renders the latest query and is reused after navigation', async ({ page }) => {
  let releaseIndex: (() => void) | undefined
  const indexReady = new Promise<void>(resolve => {
    releaseIndex = resolve
  })
  let requestCount = 0

  await page.route('**/search-index.json', async route => {
    requestCount += 1
    await indexReady
    await route.fulfill({ json: [
      { title: 'Astro guide', path: '/about/', description: 'First topic', tags: [], type: 'post' },
      { title: 'React guide', path: '/work/', description: 'Second topic', tags: [], type: 'post' }
    ] })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?q=Astro')
  await expect(page.locator('#site-search-status')).toHaveText('Loading search index.')
  await page.locator('#site-search-input').fill('React')
  releaseIndex?.()
  await expect(page.locator('[data-site-search-result-title]')).toHaveText('React guide')
  await page.locator('#site-search-input').press('Enter')
  await expect(page).toHaveURL(/\/work\/$/u)
  await page.keyboard.press('Control+k')
  await page.locator('#site-search-input').fill('Astro')
  await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
  expect(requestCount).toBe(1)
})

test('repeated search close requests cannot close a newly reopened dialog', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install()
  await page.goto('/')

  const trigger = page.locator('[data-site-search-trigger]')
  const dialog = page.locator('#site-search-dialog')

  await trigger.click()
  await expect(dialog).toBeVisible()
  await page.locator('#site-search-input').fill('Astro')

  const reopened = await page.evaluate(() => {
    const close = document.querySelector('[data-site-search-close]')
    const panel = document.querySelector('[data-site-search-panel]')
    const triggerButton = document.querySelector('[data-site-search-trigger]')
    const searchDialog = document.getElementById('site-search-dialog')

    if (!(close instanceof HTMLButtonElement) || !(panel instanceof HTMLElement) ||
      !(triggerButton instanceof HTMLButtonElement) || !(searchDialog instanceof HTMLDialogElement)) {
      throw new Error('Missing search controls')
    }

    close.click()
    close.click()
    panel.dispatchEvent(new AnimationEvent('animationend', { animationName: 'site-search-panel-out' }))
    triggerButton.click()

    return searchDialog.open
  })

  expect(reopened).toBe(true)
  await page.clock.runFor(600)

  await expect(dialog).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#site-search-input')).toBeFocused()
  expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
})

for (const modifier of ['Control', 'Meta'] as const) {
  test(`${modifier}+K can reopen search before its close animation finishes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.clock.install()
    await page.goto('/')
    await page.locator('[data-site-search-trigger]').click()
    await page.locator('#site-search-input').fill('Astro')
    await page.locator('#site-search-input').evaluate((input, key) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: key === 'Control',
        metaKey: key === 'Meta',
        bubbles: true,
        cancelable: true
      }))
    }, modifier)
    await page.clock.runFor(600)
    await expect(page.locator('#site-search-dialog')).toBeVisible()
    await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#site-search-input')).toBeFocused()
    expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
  })
}

const searchIndex = [
  { title: 'Astro guide', path: '/about/', description: 'First topic', tags: [], type: 'post' },
  { title: 'React guide', path: '/work/', description: 'Second topic', tags: [], type: 'post' }
]

test('a bare slash from the page or a focused link leaves search closed and the key unhandled', async ({ page }) => {
  let requestCount = 0

  await page.route('**/search-index.json', async route => {
    requestCount += 1
    await route.fulfill({ json: searchIndex })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const link = page.locator('a[href="#main"]').first()

  // dispatchEvent returns false only when a listener called preventDefault.
  expect(await link.evaluate(element => [document.body, element].map(target => target.dispatchEvent(
    new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })
  )))).toEqual([true, true])

  await page.keyboard.press('/')
  await expect(page.locator('#site-search-dialog')).not.toHaveAttribute('open')
  await link.focus()
  await page.keyboard.press('/')
  await expect(link).toBeFocused()
  await expect(page.locator('#site-search-dialog')).not.toHaveAttribute('open')
  await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'false')
  expect(new URL(page.url()).searchParams.has('q')).toBe(false)
  expect(requestCount).toBe(0)
})

for (const shortcut of ['Control+k', 'Meta+k']) {
  test(`${shortcut} opens search from the page and loads the index`, async ({ page }) => {
    let requestCount = 0

    await page.route('**/search-index.json', async route => {
      requestCount += 1
      await route.fulfill({ json: searchIndex })
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.keyboard.press(shortcut)
    await expect(page.locator('#site-search-dialog')).toHaveAttribute('open')
    await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#site-search-input')).toBeFocused()
    await page.locator('#site-search-input').fill('Astro')
    await expect(page.locator('[data-site-search-result-title]')).toHaveText('Astro guide')
    expect(requestCount).toBe(1)
  })
}

test('a slash typed in the search input stays literal query text', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ json: searchIndex }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Control+k')

  const input = page.locator('#site-search-input')

  await expect(input).toBeFocused()
  await page.keyboard.type('/ci/cd')
  await expect(input).toHaveValue('/ci/cd')
  await expect(input).toBeFocused()
  await expect(page.locator('#site-search-dialog')).toHaveAttribute('open')
  await expect(page.locator('#site-search-dialog')).not.toHaveAttribute('data-site-search-anim')
  expect(new URL(page.url()).searchParams.get('q')).toBe('/ci/cd')
})

test.describe('search index deadline', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.clock.install()
  })

  test('a stalled index request reaches the retry state', async ({ page }) => {
    await page.route('**/search-index.json', () => new Promise<void>(() => undefined))
    await page.goto('/?q=Astro')

    const status = page.locator('#site-search-status')

    await expect(status).toHaveText('Loading search index.')
    await page.clock.runFor(9_000)
    await expect(status).toHaveText('Loading search index.')
    await page.clock.runFor(1_000)
    await expect(status).toHaveText('Search is temporarily unavailable.')
    await expect(page.locator('[data-site-search-retry]')).toHaveCount(1)
  })

  test('a stalled index body reaches the retry state', async ({ page }) => {
    await page.addInitScript(() => {
      const nativeFetch = window.fetch.bind(window)

      window.fetch = (input, init) => {
        const url = input instanceof Request ? input.url : String(input)

        if (!url.includes('/search-index.json')) return nativeFetch(input, init)

        // The headers arrive, but the body stream never closes.
        const body = new ReadableStream<Uint8Array>({
          start: controller => {
            controller.enqueue(new TextEncoder().encode('['))
          }
        })

        return Promise.resolve(new Response(body, { headers: { 'Content-Type': 'application/json' } }))
      }
    })
    await page.goto('/?q=Astro')
    await expect(page.locator('#site-search-status')).toHaveText('Loading search index.')
    await page.clock.runFor(10_000)
    await expect(page.locator('#site-search-status')).toHaveText('Search is temporarily unavailable.')
    await expect(page.locator('[data-site-search-retry]')).toHaveCount(1)
  })

  test('retry after a timeout renders the latest query', async ({ page }) => {
    let requestCount = 0

    await page.route('**/search-index.json', async route => {
      requestCount += 1

      // The first request never answers; the retry receives the index.
      if (requestCount === 1) await new Promise<void>(() => undefined)

      await route.fulfill({ json: searchIndex })
    })
    await page.goto('/?q=Astro')
    await page.clock.runFor(10_000)
    await expect(page.locator('[data-site-search-retry]')).toHaveCount(1)
    await page.locator('#site-search-input').fill('React')
    await expect(page.locator('#site-search-status')).toHaveText('Search is temporarily unavailable.')
    await page.locator('[data-site-search-retry]').click()
    await expect(page.locator('[data-site-search-result-title]')).toHaveText('React guide')
    await expect(page.locator('#site-search-input')).toBeFocused()
    expect(new URL(page.url()).searchParams.get('q')).toBe('React')
    expect(requestCount).toBe(2)
  })

  test('a loaded index is not replaced by a later timeout', async ({ page }) => {
    await page.route('**/search-index.json', route => route.fulfill({ json: searchIndex }))
    await page.goto('/?q=Astro')

    const title = page.locator('[data-site-search-result-title]')

    await expect(title).toHaveText('Astro guide')
    await page.clock.runFor(20_000)
    await expect(title).toHaveText('Astro guide')
    await expect(page.locator('#site-search-status')).toHaveText('1 result available. Use arrow keys to navigate.')
    await expect(page.locator('[data-site-search-retry]')).toHaveCount(0)
  })
})
