import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const tabKeys = {
  chromium: { next: 'Tab', previous: 'Shift+Tab' },
  firefox: { next: 'Tab', previous: 'Shift+Tab' },
  webkit: process.platform === 'darwin' ?
    { next: 'Alt+Tab', previous: 'Alt+Shift+Tab' } :
    { next: 'Tab', previous: 'Shift+Tab' }
}

test('search wraps focus in both directions and restores its opener', async ({ page, browserName }) => {
  // An empty index keeps this example's tab sequence to Close and Search.
  await page.route('**/search-index.json', route => route.fulfill({ json: [] }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('[data-site-search]')).toHaveAttribute('data-site-search-bound', 'true')

  const opener = page.getByRole('button', { name: 'Open site search (Ctrl/⌘ K)', exact: true })
  const dialog = page.getByRole('dialog', { name: 'Search', exact: true })
  const input = dialog.getByRole('searchbox')
  const close = dialog.getByRole('button', { name: 'Close search', exact: true })
  const { next, previous } = tabKeys[browserName]

  // Focus is setup for this component test, not proof of opener reachability.
  await opener.focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Start typing to search' })).toBeVisible()
  await expect(input).toBeFocused()
  await page.keyboard.press(next)
  await expect(close).toBeFocused()
  await page.keyboard.press(previous)
  await expect(input).toBeFocused()
  await page.keyboard.press(previous)
  await expect(close).toBeFocused()
  await page.keyboard.press(next)
  await expect(input).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()

  await page.keyboard.press('Space')
  await expect(input).toBeFocused()
  await page.keyboard.press(previous)
  await expect(close).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('search failure exposes an accessible retry action', async ({ page }) => {
  await page.route('**/search-index.json', route => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open site search (Ctrl/⌘ K)', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Search', exact: true })
  await expect(dialog.getByRole('heading', { name: 'Search unavailable' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()

  const results = await new AxeBuilder({ page }).include('#site-search-dialog').analyze()
  expect(results.violations).toEqual([])
})
