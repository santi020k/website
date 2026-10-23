import { expect, type Locator, type Page, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const ARTICLE = '/blog/designing-eslint-packages-teams-actually-adopt/'
const NEXT_ARTICLE = '/blog/eslint-config-basic-version-2/'

type ShareApi = 'clipboard' | 'share'
type StubOutcome = 'AbortError' | 'NotAllowedError' | 'resolve'

// Every `navigator.share` and `navigator.clipboard.writeText` call is recorded
// and stays pending until the test dispatches `share-lifecycle:<api>:<outcome>`,
// so request counts and UI state can be asserted separately at each step.
const stubShareApis = (page: Page, nativeShare: boolean) => page.addInitScript(native => {
  const record = (api: 'clipboard' | 'share', url: string) => {
    const key = `share-lifecycle:${api}-calls`
    const previous = sessionStorage.getItem(key)

    sessionStorage.setItem(key, previous === null ? url : `${previous}\n${url}`)
  }

  const deferred = (api: 'clipboard' | 'share') => new Promise<void>((resolve, reject) => {
    const listeners = new AbortController()

    for (const outcome of ['resolve', 'AbortError', 'NotAllowedError'] as const) {
      window.addEventListener(`share-lifecycle:${api}:${outcome}`, () => {
        listeners.abort()

        if (outcome === 'resolve') resolve()
        else reject(new DOMException('stubbed for test', outcome))
      }, { signal: listeners.signal })
    }
  })

  if (native) {
    const originalMatchMedia = window.matchMedia.bind(window)

    window.matchMedia = (query: string): MediaQueryList => {
      if (query !== '(pointer: coarse)') return originalMatchMedia(query)

      return {
        addEventListener: () => undefined,
        addListener: () => undefined,
        dispatchEvent: () => false,
        matches: true,
        media: query,
        onchange: null,
        removeEventListener: () => undefined,
        removeListener: () => undefined
      }
    }
  }

  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: native ?
      (data: ShareData) => {
        record('share', data.url ?? '')

        return deferred('share')
      } :
      undefined
  })

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) => {
        record('clipboard', text)

        return deferred('clipboard')
      }
    }
  })
}, nativeShare)

const readCalls = (page: Page, api: ShareApi) => page.evaluate(key => (sessionStorage.getItem(key) ?? '')
  .split('\n')
  .filter(url => url.length > 0), `share-lifecycle:${api}-calls`)

// A message task runs only after the microtask queue drains, so any fallback or
// feedback the control chains off a settled stub has already happened.
const flushTasks = (page: Page) => page.evaluate(() => new Promise<void>(resolve => {
  const channel = new MessageChannel()

  channel.port1.onmessage = () => {
    channel.port1.close()

    resolve()
  }

  channel.port2.postMessage(null)
}))

const settle = async (page: Page, api: ShareApi, outcome: StubOutcome) => {
  await page.evaluate(name => window.dispatchEvent(new Event(name)), `share-lifecycle:${api}:${outcome}`)

  await flushTasks(page)
}

// Resolving inside this document proves Astro swapped the page client-side; a full
// load would destroy the evaluation context and fail the navigation instead.
const navigateWithClientRouter = async (page: Page, link: Locator, pathname: string) => {
  await Promise.all([
    page.evaluate(destination => new Promise<void>(resolve => {
      const onPageLoad = () => {
        if (location.pathname !== destination) return

        document.removeEventListener('astro:page-load', onPageLoad)
        resolve()
      }

      document.addEventListener('astro:page-load', onPageLoad)
    }), pathname),
    link.click()
  ])
}

const activate = async (page: Page, button: Locator) => {
  await button.focus()
  await page.keyboard.press('Enter')
}

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  // Remote comment content has its own lifecycle coverage and must not affect this audit.
  await page.route('https://giscus.app/**', route => route.abort())
})

test.describe('Share control — native share lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await stubShareApis(page, true)
  })

  test('repeated activation while the share sheet is open opens one sheet and copies nothing', async ({ page }) => {
    await page.goto(ARTICLE)

    const button = page.locator('#copy-link-btn')
    const label = page.locator('#copy-label')
    const permalink = requireValue(await button.getAttribute('data-share-url'))

    await expect(button).toHaveAccessibleName('Share link')
    await activate(page, button)
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await page.keyboard.press('Enter')
    await expect(button).toBeFocused()
    await button.click()
    await flushTasks(page)

    expect(await readCalls(page, 'share')).toEqual([permalink])
    expect(await readCalls(page, 'clipboard')).toEqual([])
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(label).toHaveText('Share link')

    await settle(page, 'share', 'resolve')

    await expect(button).not.toHaveAttribute('aria-busy')
    await expect(label).toHaveText('Share link')
    expect(await readCalls(page, 'share')).toEqual([permalink])
    expect(await readCalls(page, 'clipboard')).toEqual([])
  })

  test('success, cancellation, and failure each release the control for another share', async ({ page }) => {
    await page.goto(ARTICLE)

    const button = page.locator('#copy-link-btn')
    const label = page.locator('#copy-label')
    const permalink = requireValue(await button.getAttribute('data-share-url'))

    await activate(page, button)
    await settle(page, 'share', 'resolve')
    await expect(button).not.toHaveAttribute('aria-busy')
    await expect(button).toBeFocused()

    await page.keyboard.press('Enter')
    expect(await readCalls(page, 'share')).toEqual([permalink, permalink])
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await settle(page, 'share', 'AbortError')
    await expect(button).not.toHaveAttribute('aria-busy')
    await expect(label).toHaveText('Share link')
    expect(await readCalls(page, 'clipboard')).toEqual([])

    await page.keyboard.press('Enter')
    expect(await readCalls(page, 'share')).toEqual([permalink, permalink, permalink])
    await settle(page, 'share', 'NotAllowedError')

    // The ordinary failure falls back to one copy, and the control stays busy until it settles.
    expect(await readCalls(page, 'clipboard')).toEqual([permalink])
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await page.keyboard.press('Enter')
    await flushTasks(page)
    expect(await readCalls(page, 'share')).toHaveLength(3)
    expect(await readCalls(page, 'clipboard')).toHaveLength(1)

    await settle(page, 'clipboard', 'resolve')
    await expect(label).toHaveText('Link copied!')
    await expect(button).not.toHaveAttribute('aria-busy')
    await expect(button).toBeFocused()

    await page.keyboard.press('Enter')
    expect(await readCalls(page, 'share')).toHaveLength(4)
    await settle(page, 'share', 'resolve')
    await expect(button).not.toHaveAttribute('aria-busy')
  })

  const nextInSeries = (page: Page) => page.getByRole('navigation', { name: 'Continue reading ESLint in Practice' })
    .getByRole('link', { name: /Next in series/u })

  const destinations = [
    { name: 'the next article in the series', link: nextInSeries, path: NEXT_ARTICLE },
    {
      name: 'the About page',
      link: (page: Page) => page.locator('.site-desktop-nav').getByRole('link', { name: 'About', exact: true }),
      path: '/about/'
    }
  ]

  for (const destination of destinations) {
    test(`a share that fails after navigating to ${destination.name} copies nothing`, async ({ page }) => {
      await page.goto(ARTICLE)

      const button = page.locator('#copy-link-btn')
      const permalink = requireValue(await button.getAttribute('data-share-url'))

      await activate(page, button)
      await expect(button).toHaveAttribute('aria-busy', 'true')
      await navigateWithClientRouter(page, destination.link(page), destination.path)

      await settle(page, 'share', 'NotAllowedError')

      expect(await readCalls(page, 'share')).toEqual([permalink])
      expect(await readCalls(page, 'clipboard')).toEqual([])
    })
  }

  test('the next article shares its own permalink after a stale share settles', async ({ page }) => {
    await page.goto(ARTICLE)

    const button = page.locator('#copy-link-btn')
    const label = page.locator('#copy-label')
    const previousPermalink = requireValue(await button.getAttribute('data-share-url'))

    await activate(page, button)
    await navigateWithClientRouter(page, nextInSeries(page), NEXT_ARTICLE)
    await settle(page, 'share', 'NotAllowedError')

    const permalink = requireValue(await button.getAttribute('data-share-url'))

    expect(permalink).not.toBe(previousPermalink)
    await expect(button).not.toHaveAttribute('aria-busy')
    await expect(label).toHaveText('Share link')

    // One activation reaches exactly one handler on the swapped-in control.
    await activate(page, button)
    expect(await readCalls(page, 'share')).toEqual([previousPermalink, permalink])
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await settle(page, 'share', 'NotAllowedError')
    expect(await readCalls(page, 'clipboard')).toEqual([permalink])

    await settle(page, 'clipboard', 'resolve')
    await expect(label).toHaveText('Link copied!')
    await expect(button).not.toHaveAttribute('aria-busy')
    await expect(button).toBeFocused()
  })
})

test.describe('Share control — clipboard lifecycle', () => {
  test('repeated copy activation writes once and only the newest result controls the reset', async ({ page }) => {
    await page.clock.install()
    await stubShareApis(page, false)
    await page.goto(ARTICLE)
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))

    const button = page.locator('#copy-link-btn')
    const label = page.locator('#copy-label')
    const permalink = requireValue(await button.getAttribute('data-share-url'))

    await expect(button).toHaveAccessibleName('Copy link')
    await activate(page, button)
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await page.keyboard.press('Enter')
    await expect(button).toBeFocused()
    await button.click()
    await flushTasks(page)

    expect(await readCalls(page, 'clipboard')).toEqual([permalink])
    await expect(label).toHaveText('Copy link')

    await settle(page, 'clipboard', 'resolve')
    await expect(label).toHaveText('Link copied!')
    await expect(button).not.toHaveAttribute('aria-busy')

    await page.clock.runFor(1500)
    await activate(page, button)
    expect(await readCalls(page, 'clipboard')).toEqual([permalink, permalink])
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await settle(page, 'clipboard', 'NotAllowedError')
    await expect(label).toHaveText('Copy failed')
    await expect(button).not.toHaveAttribute('aria-busy')

    // The first result's reset would have fired here had it survived the new operation.
    await page.clock.runFor(1000)
    await expect(label).toHaveText('Copy failed')
    await expect(button).toHaveClass(/copy-failed/)

    await page.clock.runFor(1000)
    await expect(label).toHaveText('Copy link')
    await expect(button).not.toHaveClass(/copy-failed/)
    await expect(button).toBeFocused()
  })
})
