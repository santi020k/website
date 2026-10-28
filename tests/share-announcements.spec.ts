import { expect, type Locator, type Page, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const ARTICLE = '/blog/designing-eslint-packages-teams-actually-adopt/'
const NEXT_ARTICLE = '/blog/eslint-config-basic-version-2/'
const CLIPBOARD_WRITES_KEY = 'share-announcements:clipboard-writes'

// Long enough for a short announcement delay, far shorter than the two-second result period.
const ANNOUNCEMENT_MS = 250
const RETRY_AFTER_MS = 500
const RESULT_PERIOD_MS = 2000

type ClipboardStub = 'missing' | 'resolve'

const scenarios = [
  {
    announcement: 'Link copied!',
    clipboard: 'resolve',
    label: 'Link copied!',
    resetLabel: 'Copy link',
    resetAnnouncement: '',
    recoveryVisible: false,
    name: 'a successful copy',
    writes: 2
  },
  {
    announcement: 'Copy failed. Select and copy the address below, or try again.',
    clipboard: 'missing',
    label: 'Try again',
    resetLabel: 'Try again',
    resetAnnouncement: 'Copy failed. Select and copy the address below, or try again.',
    recoveryVisible: true,
    name: 'a missing clipboard',
    writes: 0
  }
] as const

// Desktop copy path only: no native share, and a clipboard that either settles
// immediately or does not exist, so every result is ready within one task.
const stubClipboard = (page: Page, clipboard: ClipboardStub) => page.addInitScript(({ key, mode }) => {
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: mode === 'missing' ?
      undefined :
      {
        writeText: (text: string) => {
          const previous = sessionStorage.getItem(key)

          sessionStorage.setItem(key, previous === null ? text : `${previous}\n${text}`)

          return Promise.resolve()
        }
      }
  })
}, { key: CLIPBOARD_WRITES_KEY, mode: clipboard })

const readClipboardWrites = (page: Page) => page.evaluate(key => (sessionStorage.getItem(key) ?? '')
  .split('\n')
  .filter(text => text.length > 0), CLIPBOARD_WRITES_KEY)

// A message task runs only after the microtask queue drains, and the installed
// clock does not fake it, so a result chained off an immediate settle has landed.
const flushTasks = (page: Page) => page.evaluate(() => new Promise<void>(resolve => {
  const channel = new MessageChannel()

  channel.port1.onmessage = () => {
    channel.port1.close()

    resolve()
  }

  channel.port2.postMessage(null)
}))

// Resolving inside this document proves Astro swapped the page client-side.
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

const nextInSeries = (page: Page) => page.getByRole('navigation', { name: 'Continue reading ESLint in Practice' })
  .getByRole('link', { name: /Next in series/u })

const activate = async (page: Page, button: Locator) => {
  await button.focus()
  await page.keyboard.press('Enter')
}

const openArticle = async (page: Page, clipboard: ClipboardStub) => {
  await stubClipboard(page, clipboard)
  await page.clock.install()
  await page.goto(ARTICLE)

  const button = page.locator('#copy-link-btn')

  // Passing the closed discussion must not start a third-party request.
  await button.scrollIntoViewIfNeeded()
  await expect(page.locator('#comments [data-giscus-mount] script')).toHaveCount(0)
  await expect(page.locator('#comments [data-giscus-error]')).toBeEmpty()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))

  const status = page.locator('#copy-status')

  await expect(button).toHaveAccessibleName('Copy link')
  await expect(status).toBeEmpty()

  return { button, label: page.locator('#copy-label'), status }
}

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  // An empty local client keeps the comments mount stable; nothing reaches the network.
  await page.route('https://giscus.app/**', async route => {
    if (new URL(route.request().url()).pathname === '/client.js') {
      await route.fulfill({
        body: '',
        contentType: 'text/javascript',
        headers: { 'access-control-allow-origin': '*' },
        status: 200
      })

      return
    }

    await route.abort()
  })
})

// DOM live-region timing only; this does not exercise real screen reader speech.
test.describe('Share control — repeated result announcements', () => {
  for (const scenario of scenarios) {
    test(`repeating ${scenario.name} empties the status for a distinct interval before announcing again`, async ({ page }) => {
      const { button, label, status } = await openArticle(page, scenario.clipboard)

      await activate(page, button)
      await page.clock.runFor(ANNOUNCEMENT_MS)
      await expect(status).toHaveText(scenario.announcement)
      await expect(label).toHaveText(scenario.label)
      await expect(button).not.toHaveAttribute('aria-busy')

      // Retry inside the first result period, while identical text is still announced.
      await page.clock.runFor(RETRY_AFTER_MS)
      await expect(status).toHaveText(scenario.announcement)
      await page.keyboard.press('Enter')
      await flushTasks(page)
      await expect(button).toBeFocused()
      await expect(button).not.toHaveAttribute('aria-busy')

      // The retry has fully settled and time is frozen, so only a pending timer
      // can still hold the result back; restoring it in the same task can be missed by assistive technology.
      await expect(status).toBeEmpty()

      await page.clock.runFor(ANNOUNCEMENT_MS)
      await expect(status).toHaveText(scenario.announcement)
      await expect(label).toHaveText(scenario.label)
      await expect(button).toHaveAccessibleName(scenario.label)
      await expect(button).toBeFocused()
      expect(await readClipboardWrites(page)).toHaveLength(scenario.writes)

      // The first result's reset would have fired by now had it survived the retry.
      await page.clock.runFor(RESULT_PERIOD_MS - RETRY_AFTER_MS)
      await expect(status).toHaveText(scenario.announcement)

      await page.clock.runFor(RETRY_AFTER_MS)

      await expect(status).toHaveText(scenario.resetAnnouncement)
      await expect(label).toHaveText(scenario.resetLabel)
      await expect(page.locator('#copy-link-btn-recovery textarea')).toBeVisible({ visible: scenario.recoveryVisible })
      await expect(button).toBeFocused()
    })
  }

  test('navigating away during the empty interval cancels the pending announcement', async ({ page }) => {
    const { button, label, status } = await openArticle(page, 'resolve')
    const previousPermalink = requireValue(await button.getAttribute('data-share-url'))

    await activate(page, button)
    await page.clock.runFor(ANNOUNCEMENT_MS)
    await expect(status).toHaveText('Link copied!')

    await page.keyboard.press('Enter')
    await flushTasks(page)
    await expect(status).toBeEmpty()

    // Keep the old region available for inspection, so a stale timer cannot hide in a detached node.
    const previousStatus = await status.elementHandle()

    await navigateWithClientRouter(page, nextInSeries(page), NEXT_ARTICLE)
    await page.clock.runFor(ANNOUNCEMENT_MS + RESULT_PERIOD_MS)

    expect(await previousStatus.evaluate(element => element.isConnected)).toBe(false)
    expect(await previousStatus.evaluate(element => element.textContent)).toBe('')
    await expect(status).toBeEmpty()
    await expect(label).toHaveText('Copy link')
    await expect(button).toHaveAccessibleName('Copy link')

    // The new article's control announces its own first result exactly once.
    const permalink = requireValue(await button.getAttribute('data-share-url'))

    expect(permalink).not.toBe(previousPermalink)
    await activate(page, button)
    await page.clock.runFor(ANNOUNCEMENT_MS)
    await expect(status).toHaveText('Link copied!')
    expect(await previousStatus.evaluate(element => element.textContent)).toBe('')
    expect(await readClipboardWrites(page)).toEqual([previousPermalink, previousPermalink, permalink])

    await previousStatus.dispose()
  })
})
