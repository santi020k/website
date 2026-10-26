import { expect, test } from '@playwright/test'

const nextKeys = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
}

test('the first Tab reaches the skip link and Enter moves focus to main', async ({ page, browserName }) => {
  await page.goto('/')
  const next = nextKeys[browserName]

  await page.keyboard.press(next)
  const skip = page.getByRole('link', { name: 'Skip to content', exact: true })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await page.keyboard.press(next)
  await expect(page.getByRole('main').getByRole('link').first()).toBeFocused()
})
