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

for (const path of ['/', '/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/', '/portfolio/lumen-ui/']) {
  test(`the first Tab inside main lands on a visible control on ${path}`, async ({ page, browserName }) => {
    await page.goto(path)
    const next = nextKeys[browserName]

    await page.keyboard.press(next)
    await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
    await page.keyboard.press(next)

    // Playwright counts a 1px clipped `.sr-only` node as visible, so measure the
    // focused control itself: it must be painted and keyboard focus must show.
    const focused = await page.evaluate(() => {
      const element = document.activeElement

      if (!(element instanceof HTMLElement)) return null

      const { height, width } = element.getBoundingClientRect()
      const style = getComputedStyle(element)

      return {
        clipped: style.getPropertyValue('clip') !== 'auto' || style.clipPath !== 'none',
        focusVisible: element.matches(':focus-visible'),
        height,
        inMain: document.getElementById('main')?.contains(element) === true,
        painted: element.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
        width
      }
    })

    expect(focused).not.toBeNull()
    expect(focused?.inMain).toBe(true)
    expect(focused?.painted).toBe(true)
    expect(focused?.clipped).toBe(false)
    expect(focused?.focusVisible).toBe(true)
    expect(focused?.width).toBeGreaterThan(8)
    expect(focused?.height).toBeGreaterThan(8)
  })
}
