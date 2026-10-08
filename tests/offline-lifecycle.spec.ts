import { expect, test } from '@playwright/test'

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

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    window.dispatchEvent(new Event('online'))
  })

  await expect(status).toHaveText('Connection restored. Try again to load the latest page.')
})
