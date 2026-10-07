import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const width of [320, 375, 390, 768, 1024, 1280, 1440]) {
  for (const fontSize of ['16px', '20px']) {
    test(`header controls fit at ${width}px with ${fontSize} text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.evaluate(size => {
        document.documentElement.style.fontSize = size
      }, fontSize)
      await expect(page.locator('html')).toHaveCSS('font-size', fontSize)
      // Rem-based theme values settle on the next paint after text resizing.
      await page.evaluate(async () => {
        await document.fonts.ready
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve()
            })
          })
        })
      })

      const geometry = await page.locator('[data-header-shell]').evaluate(shell => {
        const bounds = shell.getBoundingClientRect()
        const controls = [...shell.querySelectorAll('a, button')]
          .filter(element => element.getClientRects().length > 0)
          .map(element => {
            const rect = element.getBoundingClientRect()

            return { left: rect.left, right: rect.right, height: rect.height, width: rect.width }
          })

        const hero = document.querySelector('[data-home-hero]')?.getBoundingClientRect()

        if (!hero) throw new Error('Home hero has no rendered bounds')

        return {
          left: bounds.left,
          right: bounds.right,
          bottom: bounds.bottom,
          heroTop: hero.top,
          heroLeft: hero.left,
          heroRight: hero.right,
          controls
        }
      })

      expect(Math.abs(geometry.left - geometry.heroLeft)).toBeLessThanOrEqual(1)
      expect(Math.abs(geometry.right - geometry.heroRight)).toBeLessThanOrEqual(1)
      expect(Math.abs(geometry.bottom - geometry.heroTop)).toBeLessThanOrEqual(1)

      for (const [index, control] of geometry.controls.entries()) {
        expect(control.left).toBeGreaterThanOrEqual(geometry.left)
        expect(control.right).toBeLessThanOrEqual(geometry.right)
        expect(control.height).toBeGreaterThanOrEqual(44)
        expect(control.width).toBeGreaterThanOrEqual(44)

        const previous = geometry.controls[index - 1]

        if (previous) expect(control.left).toBeGreaterThanOrEqual(previous.right)
      }
    })
  }
}

for (const theme of ['light', 'dark']) {
  test(`desktop navigation is accessible and marks the current route in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(selectedTheme => {
      localStorage.setItem('theme', selectedTheme)
    }, theme)
    await page.goto('/about/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    const navigation = page.locator('.site-desktop-nav')

    await expect(navigation.locator('a[href="/about/"]')).toHaveAttribute('aria-current', 'page')
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1)

    const results = await new AxeBuilder({ page }).include('header').analyze()

    expect(results.violations).toEqual([])
  })
}

test('the open menu keeps header utilities and close reachable by keyboard', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const toggle = page.locator('[data-mobile-nav-toggle]')
  const firstLink = page.locator('[data-mobile-nav-link]').first()
  const previousKey = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'

  await toggle.press('Enter')
  await expect(firstLink).toBeFocused()

  const nextKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'

  for (const link of await page.locator('[data-mobile-nav-link]').all()) {
    await expect(link).toBeFocused()
    await page.keyboard.press(nextKey)
  }

  await expect(page.locator('[data-mobile-nav-actions] a').first()).toBeFocused()
  await page.keyboard.press(nextKey)
  await expect(page.locator('[data-mobile-nav-actions] a').last()).toBeFocused()
  await page.keyboard.press(nextKey)
  await expect(page.locator('.site-header-brand')).toBeFocused()
  await firstLink.focus()
  await page.keyboard.press(previousKey)
  await expect(toggle).toBeFocused()
  await page.keyboard.press(previousKey)
  await expect(page.locator('[data-theme-toggle-btn]')).toBeFocused()
  await page.keyboard.press(previousKey)
  await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#site-search-input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(toggle).toBeFocused()
})

test('the mobile frame stays joined through closing and rapid reopening', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const toggle = page.locator('[data-mobile-nav-toggle]')
  const panel = page.locator('[data-mobile-nav-panel]')
  const backdrop = page.locator('[data-mobile-nav-backdrop]')

  await toggle.click()
  await expect(page.locator('[data-mobile-nav-link]').last()).toHaveCSS('opacity', '1')
  // Capture the closing frame and reopen in one task, before its exit animation can finish.
  const closingState = await toggle.evaluate(button => {
    if (!(button instanceof HTMLButtonElement)) throw new TypeError('Expected a menu button')

    const root = button.closest('[data-mobile-nav]')
    const menu = root?.querySelector('[data-mobile-nav-panel]')
    const overlay = root?.querySelector('[data-mobile-nav-backdrop]')

    if (!(menu instanceof HTMLElement) || !(overlay instanceof HTMLElement)) {
      throw new TypeError('Expected a mobile menu and backdrop')
    }

    button.click()

    const state = {
      expanded: button.getAttribute('aria-expanded'),
      panelInert: menu.inert,
      backdropVisible: !overlay.hidden && overlay.getClientRects().length > 0 &&
        getComputedStyle(overlay).visibility === 'visible',
      scrollLocked: document.documentElement.classList.contains('mobile-nav-open')
    }

    button.click()

    return state
  })
  expect(closingState).toEqual({
    expanded: 'false',
    panelInert: true,
    backdropVisible: true,
    scrollLocked: true
  })
  await expect.poll(() => panel.evaluate(element => element.getAnimations({ subtree: true })
    .filter(animation => animation.playState === 'running').length)).toBe(0)
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(panel).toBeVisible()
  await expect(panel).not.toHaveAttribute('inert')
  await expect(page.locator('[data-mobile-nav-link]').first()).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(backdrop).toBeHidden()
  await expect(page.locator('html')).not.toHaveClass(/mobile-nav-open/)
})

test('reduced motion reveals every menu row immediately without a stagger', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-mobile-nav-toggle]').click()

  for (const link of await page.locator('[data-mobile-nav-link]').all()) {
    await expect(link).toHaveCSS('animation-name', 'none')
    await expect(link).toHaveCSS('opacity', '1')
  }

  await expect(page.locator('[data-mobile-nav-backdrop]')).toHaveCSS('animation-name', 'none')
})

test('the menu follows the dock after scrolling and closes on desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => {
    window.scrollTo(0, 500)
  })
  await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')
  await page.locator('[data-mobile-nav-toggle]').click()

  const shell = await page.locator('[data-header-shell]').boundingBox()
  const panel = await page.locator('[data-mobile-nav-panel]').boundingBox()

  if (!shell || !panel) throw new Error('Navigation has no rendered bounds')

  expect(Math.abs(panel.y - (shell.y + shell.height))).toBeLessThanOrEqual(1)
  expect(panel.x).toBe(shell.x)
  expect(panel.width).toBe(shell.width)

  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(page.locator('.site-desktop-nav')).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/mobile-nav-open/)
})
