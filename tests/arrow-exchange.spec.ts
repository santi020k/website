import { expect, type Locator, test } from '@playwright/test'

const arrowPosition = (arrow: Locator) => arrow.evaluate(element => {
  const bounds = element.getBoundingClientRect()
  const glyphs = [...element.querySelectorAll('[data-arrow-glyph]')].map(glyph => {
    const rect = glyph.getBoundingClientRect()

    return { x: rect.x - bounds.x, y: rect.y - bounds.y }
  })

  return { bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, glyphs }
})

test.describe('Pointer arrow exchange', () => {
  test.use({ isMobile: false, hasTouch: false })

  for (const theme of ['light', 'dark'] as const) {
    test(`action arrows exchange slowly without moving the button in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto('/')

      for (const selector of ['.maker-hero-primary', '.maker-hero-secondary', '.site-header-contact a']) {
        const action = page.locator(selector).first()
        const arrow = action.locator('[data-arrow-exchange]')
        const track = arrow.locator('[data-arrow-track]')
        const resting = await arrowPosition(arrow)
        const buttonBounds = await action.boundingBox()

        await action.hover()
        await expect(track).toHaveCSS('animation-duration', '0.48s')
        await expect.poll(() => track.evaluate(element => element.getAnimations()[0]?.playState)).toBe('finished')
        const settled = await arrowPosition(arrow)

        expect(settled.glyphs[1]?.x).toBeCloseTo(resting.glyphs[0]?.x ?? NaN, 2)
        expect(settled.glyphs[1]?.y).toBeCloseTo(resting.glyphs[0]?.y ?? NaN, 2)
        expect(settled.bounds).toEqual(resting.bounds)
        expect(await action.boundingBox()).toEqual(buttonBounds)
        await expect(arrow).toHaveAttribute('aria-hidden', 'true')

        // Leaving and quickly returning must restart cleanly with one centered arrow.
        await page.mouse.move(0, 0)
        await expect(track).toHaveCSS('transform', 'none')
        expect(await arrowPosition(arrow)).toEqual(resting)
        await action.hover()
        await page.mouse.move(0, 0)
        await expect(track).toHaveCSS('transform', 'none')
      }
    })
  }
})

test('keyboard focus exchanges the arrow and keeps native link navigation', async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const primary = page.locator('[data-home-hero] .maker-hero-primary')
  const secondary = page.locator('[data-home-hero] .maker-hero-secondary')

  await primary.focus()
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
  await expect(secondary).toBeFocused()
  await expect(secondary).toHaveAccessibleName('About me')
  await expect(secondary).toHaveCSS('outline-style', 'solid')
  await expect(secondary.locator('[data-arrow-track]')).toHaveCSS('animation-duration', '0.48s')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/about/')
})

test('downward and shared button arrows preserve their direction and reduced-motion behavior', async ({ page }) => {
  for (const { path, selector, direction } of [
    { path: '/work/', selector: '[data-work-hero-actions] .maker-hero-primary', direction: 'down' },
    { path: '/blog/', selector: '[data-blog-primary-path] a', direction: 'right' },
    { path: '/speaking/', selector: '[data-invitation-action] a', direction: 'up-right' }
  ]) {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(path)
    const action = page.locator(selector).first()
    const arrow = action.locator('[data-arrow-exchange]')
    const track = arrow.locator('[data-arrow-track]')

    await expect(arrow).toHaveAttribute('data-arrow-exchange', direction)
    await action.focus()
    await expect(track).toHaveCSS('animation-duration', '0.48s')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(track).toHaveCSS('animation-name', 'none')
    await expect(track).toHaveCSS('transform', 'none')
    await action.focus()
    await expect(track).toHaveCSS('animation-name', 'none')
  }
})

test('touch input leaves arrows still and buttons remain usable at mobile widths', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  try {
    await page.goto('/')
    const action = page.locator('[data-home-hero] .maker-hero-secondary')
    const track = action.locator('[data-arrow-track]')

    await action.hover()
    await expect(track).toHaveCSS('animation-name', 'none')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await action.tap()
    await expect(page).toHaveURL('/about/')
  } finally {
    await context.close()
  }
})
