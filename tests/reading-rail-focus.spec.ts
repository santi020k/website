import { expect, type Locator, test } from '@playwright/test'

import { keyboardNavigationKeys } from './helpers/keyboard'

const expandChapters = async (rail: Locator) => {
  for (const chapter of await rail.locator('[data-reading-contents] details').all()) {
    if (await chapter.getAttribute('open') === null) await chapter.locator('summary').click()
    await expect(chapter).toHaveAttribute('open', '')
  }
}

const expectUnobscuredFocus = async (control: Locator, rail: Locator) => {
  await expect(control).toBeFocused()
  await expect(control).toHaveCSS('outline-style', 'solid')
  await expect(rail).toHaveCSS('mask-image', 'none')
  await expect.poll(() => control.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const visibleRail = element.closest('aside')?.getBoundingClientRect()

    return visibleRail !== undefined && bounds.top >= Math.max(0, visibleRail.top) - 1 &&
      bounds.bottom <= Math.min(innerHeight, visibleRail.bottom) + 1
  })).toBe(true)
}

for (const width of [1280, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`short reading rails keep forward and reverse keyboard focus clear at ${width}px in ${theme}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 600 })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto('/portfolio/smith-commerce/')
      await page.evaluate(() => document.fonts.ready)
      const rail = page.locator('aside[data-reading-rail]')

      await expect(rail).toBeVisible()
      await rail.scrollIntoViewIfNeeded()
      await expandChapters(rail)
      expect(await rail.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
      const controls = rail.locator('[data-reading-contents] summary, [data-reading-contents] a[href]').filter({ visible: true })
      const keys = keyboardNavigationKeys(browserName)
      const count = await controls.count()

      expect(count).toBeGreaterThan(2)
      await controls.first().focus()
      for (let index = 1; index < count; index++) {
        await page.keyboard.press(keys.next)
        await expectUnobscuredFocus(controls.nth(index), rail)
      }
      for (let index = count - 2; index >= 0; index--) {
        await page.keyboard.press(keys.previous)
        await expectUnobscuredFocus(controls.nth(index), rail)
      }
    })
  }
}
