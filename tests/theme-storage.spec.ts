import { expect, test } from '@playwright/test'

for (const blockedMethod of ['getItem', 'setItem'] as const) {
  test(`preserves the selected theme across navigation when ${blockedMethod} is blocked`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.addInitScript(method => {
      // A failed write can leave an older saved preference behind.
      if (method === 'setItem') localStorage.setItem('theme', 'light')

      Storage.prototype[method] = () => {
        throw new DOMException('Storage unavailable', 'SecurityError')
      }
    }, blockedMethod)
    await page.goto('/')

    const root = page.locator('html')
    const toggle = page.locator('[data-theme-toggle-btn]')

    await expect(root).toHaveAttribute('data-theme', 'santi020k-light')
    await toggle.click()
    await expect(root).toHaveAttribute('data-theme', 'santi020k-dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/)
    await expect(root).toHaveAttribute('data-theme', 'santi020k-dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(root).toHaveAttribute('data-theme', 'santi020k-dark')

    await toggle.click()
    await expect(root).toHaveAttribute('data-theme', 'santi020k-light')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await page.goBack()
    await expect(page).toHaveURL('/')
    await expect(root).toHaveAttribute('data-theme', 'santi020k-light')
  })
}

test('follows system theme changes when no explicit choice exists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-dark')
})

for (const { mode, next, colors: expectedColors } of [
  { mode: 'light', next: 'dark', colors: ['257 64% 98%', '267 77% 42%'] },
  { mode: 'dark', next: 'light', colors: ['258 41% 8%', '262 87% 76%'] }
] as const) {
  for (const savedTheme of [mode, `santi020k-${mode}`]) {
    test(`restores ${savedTheme} with the named palette and keyboard toggle`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: next, reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        if (!localStorage.getItem('theme')) localStorage.setItem('theme', value)
      }, savedTheme)
      await page.goto('/')

      const root = page.locator('html')
      const toggle = page.locator('[data-theme-toggle-btn]')

      await expect(toggle).toHaveAttribute('data-ui-bound', 'true')
      await expect(root).toHaveAttribute('data-theme', `santi020k-${mode}`)
      await expect(toggle).toHaveAttribute('aria-pressed', String(mode === 'dark'))
      await expect(root).toHaveCSS('color-scheme', mode)
      const colors = await root.evaluate(element => {
        const style = getComputedStyle(element)

        return ['--canvas', '--brand'].map(token => style.getPropertyValue(token).trim())
      })

      expect(colors).toEqual(expectedColors)
      await toggle.focus()
      await page.keyboard.press('Enter')

      await expect(root).toHaveAttribute('data-theme', `santi020k-${next}`)
      await expect(toggle).toBeFocused()
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(`santi020k-${next}`)
      await page.reload()
      await expect(root).toHaveAttribute('data-theme', `santi020k-${next}`)
    })
  }
}

test('ignores an unsupported saved theme and keeps increased-contrast tokens', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', contrast: 'more' })
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'unknown-theme')
  })
  await page.goto('/')
  await expect(page.locator('[data-theme-toggle-btn]')).toHaveAttribute('data-ui-bound', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
  const tokens = await page.locator('html').evaluate(element => {
    const style = getComputedStyle(element)

    return ['--line', '--ink-soft', '--ink-muted', '--ink'].map(token => style.getPropertyValue(token).trim())
  })

  expect(tokens[0]).toBe(tokens[1])
  expect(tokens[2]).toBe(tokens[3])
})

test.describe('theme without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('renders the named light appearance before enhancement', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
