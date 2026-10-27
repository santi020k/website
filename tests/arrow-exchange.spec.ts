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

  test('homepage cards and footer links exchange their arrows without changing their footprint', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')

    for (const selector of [
      '.maker-hero-project',
      '[data-work-action]',
      '[data-supporting-arrow]',
      '[data-reading-slip-footer]',
      '[data-community-arrow]',
      '.maker-footer-action-arrow',
      '.maker-footer-email-arrow',
      '.maker-footer-resume',
      '.maker-footer-social a',
      '.maker-footer-version'
    ]) {
      const arrow = page.locator(selector).first().locator('[data-arrow-exchange]').or(
        page.locator(`${selector}[data-arrow-exchange]`).first()
      )
      await expect(arrow).toHaveCount(1)
      const action = arrow.locator('xpath=ancestor::a[1]')
      await action.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      const resting = await arrowPosition(arrow)
      const track = arrow.locator('[data-arrow-track]')

      await action.hover()
      await expect(track).toHaveCSS('animation-duration', '0.48s')
      await expect.poll(() => track.evaluate(element => element.getAnimations()[0]?.playState)).toBe('finished')
      const settled = await arrowPosition(arrow)

      expect(settled.glyphs[1]?.x).toBeCloseTo(resting.glyphs[0]?.x ?? NaN, 2)
      expect(settled.glyphs[1]?.y).toBeCloseTo(resting.glyphs[0]?.y ?? NaN, 2)
      expect(settled.bounds.width).toEqual(resting.bounds.width)
      expect(settled.bounds.height).toEqual(resting.bounds.height)
      await expect(arrow).toHaveAttribute('aria-hidden', 'true')
      await page.mouse.move(0, 0)
      await expect(track).toHaveCSS('transform', 'none')
    }

    // A comparison between two scores is content, not a navigation affordance.
    await expect(page.locator('[data-work-score] [data-arrow-exchange]')).toHaveCount(0)
    await expect(page.locator('[data-work-score] .lucide-arrow-right')).toHaveCount(1)
  })

  for (const path of ['/', '/about/', '/work/', '/projects/', '/portfolio/', '/blog/', '/speaking/', '/technologies/', '/history/', '/travel/', '/resume/', '/portfolio/lumen-ui/', '/blog/migrate-eslint-8-or-less-to-eslint-9/']) {
    test(`navigation arrows are connected on ${path}`, async ({ page }) => {
      await page.goto(path)
      const missing = await page.locator('a svg[class*="lucide-arrow-"]').evaluateAll(arrows => arrows.filter(arrow => (
        !arrow.closest('[data-arrow-exchange], [data-work-score]')
      )).map(arrow => arrow.closest('a')?.getAttribute('href')))

      expect(missing).toEqual([])
      const unowned = await page.locator('main [data-arrow-exchange]').evaluateAll(arrows => arrows.filter(arrow => (
        !arrow.closest('a, button, [data-arrow-owner]')
      )).map(arrow => arrow.outerHTML))

      expect(unowned).toEqual([])
      const action = page.locator('main a:has([data-arrow-exchange])').first()
      await action.focus()
      await expect(action.locator('[data-arrow-track]').first()).toHaveCSS('animation-duration', '0.48s')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(action.locator('[data-arrow-track]').first()).toHaveCSS('animation-name', 'none')
    })
  }

  test('Markdown reference arrows use the same exchange without moving the reference row', async ({ page }) => {
    await page.goto('/blog/migrate-eslint-8-or-less-to-eslint-9/')
    for (const direction of ['right', 'up-right']) {
      const arrow = page.locator(`[data-reference-link] [data-arrow-exchange="${direction}"]`).first()
      const action = arrow.locator('xpath=ancestor::a[1]')
      await action.scrollIntoViewIfNeeded()
      const resting = await arrowPosition(arrow)
      await action.hover()
      const track = arrow.locator('[data-arrow-track]')
      await expect(track).toHaveCSS('animation-duration', '0.48s')
      await expect.poll(() => track.evaluate(element => element.getAnimations()[0]?.playState)).toBe('finished')
      const settled = await arrowPosition(arrow)

      expect(settled.bounds).toEqual(resting.bounds)
      expect(settled.glyphs[1]?.x).toBeCloseTo(resting.glyphs[0]?.x ?? NaN, 2)
      expect(settled.glyphs[1]?.y).toBeCloseTo(resting.glyphs[0]?.y ?? NaN, 2)
      await page.mouse.move(0, 0)
      await expect(track).toHaveCSS('transform', 'none')
    }
  })

  test('project overlay links animate the visible arrow on keyboard focus', async ({ page }) => {
    for (const path of ['/portfolio/', '/portfolio/lumen-ui/']) {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto(path)
      const card = page.locator('[data-arrow-owner]').first()
      await card.locator('a').focus()
      await expect(card.locator('[data-arrow-track]')).toHaveCSS('animation-duration', '0.48s')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(card.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'none')
    }
  })

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
