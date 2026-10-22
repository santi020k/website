import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Connection folio in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('announces connectivity changes, updates its icon and supports retry', async ({ page, context }) => {
      await page.goto('/offline/')
      const folio = page.getByRole('region', { name: 'What\'s cached', exact: true })
      const status = folio.locator('[data-connection-status]')

      await expect(folio.getByRole('heading', { level: 2 })).toHaveText('What\'s cached')
      await expect(status).toHaveAttribute('aria-live', 'polite')
      await expect(status).toHaveAttribute('aria-atomic', 'true')
      await expect(status).toHaveText('Connection restored. Try again to load the latest page.')
      await expect(folio.locator('[data-connection-online]')).toBeVisible()
      await expect(folio.locator('[data-connection-offline]')).toBeHidden()
      await expectNoUnexpectedAccessibilityViolations(page)

      await context.setOffline(true)
      await expect(status).toHaveText('You appear to be offline.')
      await expect(folio.locator('[data-connection-offline]')).toBeVisible()
      await expect(folio.locator('[data-connection-online]')).toBeHidden()

      await context.setOffline(false)
      await expect(status).toHaveText('Connection restored. Try again to load the latest page.')
      await expect(folio.locator('[data-connection-online]')).toBeVisible()
      const retry = page.getByRole('button', { name: 'Try again', exact: true })

      await retry.focus()
      await expect(retry).toBeFocused()
      await Promise.all([page.waitForEvent('load'), retry.press('Enter')])
      await expect(page).toHaveURL('/offline/')
      expect(await page.evaluate(() => performance.getEntriesByType('navigation')
        .some(entry => entry instanceof PerformanceNavigationTiming && entry.type === 'reload'))).toBe(true)
      await expect(status).toHaveText('Connection restored. Try again to load the latest page.')
    })

    test('keeps whole words at 320px with enlarged text', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 })
      await page.goto('/offline/')
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      await page.evaluate(() => document.fonts.ready)
      const folio = page.getByRole('region', { name: 'What\'s cached', exact: true })
      const brokenWords = await folio.evaluate(element => {
        const broken: string[] = []
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)

        while (walker.nextNode()) {
          const node = walker.currentNode

          for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
            const range = document.createRange()

            range.setStart(node, match.index)
            range.setEnd(node, match.index + match[0].length)
            if (range.getClientRects().length > 1) broken.push(match[0])
          }
        }
        return broken
      })

      expect(brokenWords).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  })
}

test('releases connection listeners when leaving the offline page and rebinds on return', async ({ page }) => {
  await page.goto('/offline/')

  const status = page.locator('[data-connection-status]')

  await expect(status).toHaveText('Connection restored. Try again to load the latest page.')

  await status.evaluate(element => {
    const observer = new MutationObserver(() => {
      if (!element.isConnected) {
        document.documentElement.dataset.staleOfflineUpdate = 'true'
      }
    })

    observer.observe(element, { childList: true, subtree: true, characterData: true })
  })

  await page.getByRole('link', { name: 'Go home', exact: true }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('[data-connection-status]')).toHaveCount(0)

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    window.dispatchEvent(new Event('offline'))
  })

  // Drain mutation callbacks before reading the stale-listener probe.
  expect(await page.evaluate(() => document.documentElement.dataset.staleOfflineUpdate)).toBeUndefined()

  await page.evaluate(() => {
    const link = document.createElement('a')

    link.href = '/offline/'
    link.textContent = 'Return to offline page'
    document.querySelector('main')?.append(link)
  })

  await page.getByRole('link', { name: 'Return to offline page', exact: true }).click()

  await expect(page).toHaveURL(/\/offline\/$/)
  await expect(status).toHaveText('You appear to be offline.')
  await expect(page.locator('[data-connection-offline]')).toBeVisible()
  await expect(page.locator('[data-connection-online]')).toBeHidden()

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    window.dispatchEvent(new Event('online'))
  })

  await expect(status).toHaveText('Connection restored. Try again to load the latest page.')
  await expect(page.locator('[data-connection-online]')).toBeVisible()
  await expect(page.locator('[data-connection-offline]')).toBeHidden()
})
