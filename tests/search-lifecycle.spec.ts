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
  await page.keyboard.press('/')
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

for (const key of ['k', '/']) {
  test(`${key} can reopen search before its close animation finishes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.clock.install()
    await page.goto('/')
    await page.locator('[data-site-search-trigger]').click()
    await page.locator('#site-search-input').fill('Astro')
    await page.locator('#site-search-input').evaluate((input, shortcut) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: shortcut,
        ctrlKey: shortcut === 'k',
        bubbles: true,
        cancelable: true
      }))
    }, key)
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
