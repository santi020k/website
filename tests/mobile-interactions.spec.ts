import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

import { waitForVisibleAnimations } from './helpers/accessibility'

const expectWithinViewport = async (page: Page, locator: Locator) => {
  const bounds = await locator.boundingBox()
  const viewport = page.viewportSize()

  expect(bounds).not.toBeNull()
  expect(viewport).not.toBeNull()

  if (!bounds || !viewport) throw new Error('Missing viewport or visible element')

  expect(bounds.x).toBeGreaterThanOrEqual(-1)
  expect(bounds.y).toBeGreaterThanOrEqual(-1)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1)
}

for (const theme of ['light', 'dark']) {
  for (const [width, height, fontSize] of [
    [320, 568, 32],
    [375, 667, 32],
    [667, 375, 32],
    [667, 250, 32],
    [375, 300, 16],
    [1440, 900, 32],
    [390, 844, 16]
  ] as const) {
    test(`search stays usable at ${width}x${height}, ${fontSize}px text, ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.evaluate(({ fontSize, theme }) => {
        document.documentElement.style.fontSize = `${fontSize}px`

        document.documentElement.dataset.theme = theme
      }, { fontSize, theme })
      await page.locator('[data-mobile-nav-toggle]').click()
      await page.locator('[data-site-search-trigger]').click()

      const input = page.locator('#site-search-input')
      const close = page.locator('[data-site-search-close]')
      const results = page.locator('#site-search-results')

      await expect(input).toBeFocused()
      await input.fill('Astro')
      await expect(page.locator('[data-site-search-result]').first()).toBeVisible()

      for (const locator of [input, close, results]) await expectWithinViewport(page, locator)

      const inputBounds = await input.boundingBox()
      const resultsBounds = await results.boundingBox()

      expect(inputBounds?.width).toBeGreaterThanOrEqual(100)
      const titleBounds = await page.locator('[data-site-search-result-title]').first().boundingBox()

      expect(titleBounds?.width).toBeGreaterThanOrEqual(160)
      expect(resultsBounds?.height).toBeGreaterThanOrEqual(44)

      const lastResult = page.locator('[data-site-search-result]').last()

      await lastResult.focus()
      await expect(lastResult).toBeFocused()
      await expect.poll(() => results.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
      await expectWithinViewport(page, close)
      await expectWithinViewport(page, input)

      // Reading or tabbing through results must not pan the dialog itself.
      const dialogScroll = await page.locator('#site-search-dialog').evaluate(element => ({
        x: element.scrollLeft,
        y: element.scrollTop,
        overflow: element.scrollWidth > element.clientWidth + 1
      }))

      expect(dialogScroll).toEqual({ x: 0, y: 0, overflow: false })

      await close.click()
      await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
      await expect(page.locator('#mobile-nav')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-mobile-nav-toggle]')).toBeFocused()
    })
  }

  test(`open menu follows live text resizing in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme
    }, theme)
    await page.locator('[data-mobile-nav-toggle]').click()

    for (const fontSize of ['200%', '125%', '100%']) {
      await page.evaluate(fontSize => {
        document.documentElement.style.fontSize = fontSize
      }, fontSize)
      await expect.poll(() => page.evaluate(() => {
        const shell = document.querySelector('[data-header-shell]')?.getBoundingClientRect()
        const menu = document.querySelector('#mobile-nav')?.getBoundingClientRect()

        return shell && menu ? Math.abs(shell.bottom - menu.top - 1) : Infinity
      })).toBeLessThanOrEqual(1)
      await expect(page.locator('[data-mobile-nav-toggle]')).toHaveAttribute('aria-expanded', 'true')
    }

    await page.keyboard.press('Escape')
    await expect(page.locator('[data-mobile-nav-toggle]')).toBeFocused()
  })

  for (const forcedColors of ['none', 'active'] as const) {
    test(`header controls retain keyboard outlines in ${theme}, forced colors ${forcedColors}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.emulateMedia({ forcedColors })
      await page.goto('/')
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme
      }, theme)
      await page.locator('[data-mobile-nav-toggle]').focus()

      for (const selector of ['[data-theme-toggle-btn]', '[data-site-search-trigger]']) {
        await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')
        await expect(page.locator(selector)).toBeFocused()
        const outline = await page.locator(selector).evaluate(element => {
          const style = getComputedStyle(element)

          return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
        })

        expect(outline.style).toBe('solid')
        expect(outline.width).toBeGreaterThanOrEqual(2)
      }
    })
  }

  test(`compact search has no automated accessibility violations in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.evaluate(theme => {
      document.documentElement.style.fontSize = '200%'

      document.documentElement.dataset.theme = theme
    }, theme)
    await page.locator('[data-site-search-trigger]').click()
    await page.locator('#site-search-input').fill('Astro')
    await expect(page.locator('[data-site-search-result]').first()).toBeVisible()
    // Measure final dialog colors after the entrance fade, as other axe scans do.
    await waitForVisibleAnimations(page)
    const result = await new AxeBuilder({ page }).include('#site-search-dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(result.violations).toEqual([])
  })
}

test('canceling a mobile action leaves its menu and focused link available', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-mobile-nav-toggle]').click()
  await page.evaluate(() => {
    document.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('[data-mobile-nav-actions] a')) {
        event.preventDefault()
      }
    }, { once: true })
  })
  const action = page.locator('[data-mobile-nav-actions] a[target="_blank"]')

  await action.focus()
  await action.press('Enter')
  await expect(action).toBeFocused()
  await expect(page.locator('[data-mobile-nav-toggle]')).toHaveAttribute('aria-expanded', 'true')
})

test('a completed new-tab mobile action restores focus to the menu toggle', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-mobile-nav-toggle]').click()
  const action = page.locator('[data-mobile-nav-actions] a[target="_blank"]')

  // Keep the browser's genuine new-tab behavior without contacting an external service.
  await action.evaluate(element => {
    element.setAttribute('href', '/accessibility/')
  })
  const newPage = context.waitForEvent('page')

  await action.press('Enter')
  const popup = await newPage

  await popup.close()
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(page.locator('[data-mobile-nav-toggle]')).toBeFocused()
})

test('wrapping backward through the menu reveals the last focused action', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 667, height: 375 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-mobile-nav-toggle]').click()
  await page.locator('.site-header-brand').focus()
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')
  const last = page.locator('[data-mobile-nav-actions] a').last()

  await expect(last).toBeFocused()
  await expect(last).toBeInViewport({ ratio: 1 })
  const boxes = await last.evaluate(element => {
    const item = element.getBoundingClientRect()
    const port = element.closest('[data-mobile-nav-surface]')?.getBoundingClientRect()

    return {
      item: { top: item.top, bottom: item.bottom },
      port: port ? { top: port.top, bottom: port.bottom } : undefined
    }
  })

  expect(boxes.port).toBeDefined()
  expect(boxes.item.top).toBeGreaterThanOrEqual(boxes.port?.top ?? Infinity)
  expect(boxes.item.bottom).toBeLessThanOrEqual(boxes.port?.bottom ?? -Infinity)
})

test('wrapping backward through search reveals the last result', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 667, height: 375 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-site-search-trigger]').click()
  await page.locator('#site-search-input').fill('Astro')
  const last = page.locator('[data-site-search-result]').last()

  await expect(last).toBeVisible()
  await page.locator('[data-site-search-close]').focus()
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')
  await expect(last).toBeFocused()
  await expect(last).toBeInViewport({ ratio: 1 })
  const scroll = await last.evaluate(element => {
    const results = element.closest('#site-search-results')

    if (!results) throw new Error('Missing search results container')

    const item = element.getBoundingClientRect()
    const port = results.getBoundingClientRect()
    const center = item.left + item.width / 2
    const style = getComputedStyle(element)
    const outlineWidth = Number.parseFloat(style.outlineWidth)
    const ring = Math.max(0, outlineWidth + Number.parseFloat(style.outlineOffset))

    return {
      current: results.scrollTop,
      hasOutline: style.outlineStyle !== 'none' && outlineWidth > 0,
      top: item.top - ring,
      bottom: item.bottom + ring,
      portTop: port.top,
      portBottom: port.bottom,
      topReachable: element.contains(document.elementFromPoint(center, item.top + 1)),
      bottomReachable: element.contains(document.elementFromPoint(center, item.bottom - 1))
    }
  })

  expect(scroll.current).toBeGreaterThan(0)
  expect(scroll.hasOutline).toBe(true)
  expect(scroll.top).toBeGreaterThanOrEqual(scroll.portTop)
  expect(scroll.bottom).toBeLessThanOrEqual(scroll.portBottom)
  expect(scroll.topReachable).toBe(true)
  expect(scroll.bottomReachable).toBe(true)
  await expectWithinViewport(page, page.locator('[data-site-search-close]'))
})

test('switching to desktop navigation retains the focused destination', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-mobile-nav-toggle]').click()
  await page.locator('#mobile-nav a[href="/about/"]').focus()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(page.locator('.site-desktop-nav a[href="/about/"]')).toBeFocused()
})

test('forced colors preserve the menu symbol and current desktop page marker', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto('/')
  const symbol = await page.locator('.site-menu-grid > span').first().evaluate(element => {
    const style = getComputedStyle(element)

    return { style: style.borderTopStyle, width: Number.parseFloat(style.borderTopWidth) }
  })

  expect(symbol.style).toBe('solid')
  expect(symbol.width).toBeGreaterThanOrEqual(1)
  await page.setViewportSize({ width: 1440, height: 900 })
  const marker = await page.locator('.site-desktop-nav a[aria-current="page"]').evaluate(element => {
    const style = getComputedStyle(element, '::after')

    return { style: style.borderBottomStyle, width: Number.parseFloat(style.borderBottomWidth) }
  })

  expect(marker.style).toBe('solid')
  expect(marker.width).toBeGreaterThanOrEqual(2)
})

for (const width of [375, 667]) {
  test(`short landscape menu leaves a complete row visible at ${width}px with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 250 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await page.locator('[data-mobile-nav-toggle]').click()
    const first = page.locator('[data-mobile-nav-link]').first()

    await expect(first).toBeFocused()
    await expect(first).toBeInViewport({ ratio: 1 })
    await expectWithinViewport(page, page.locator('[data-mobile-nav-surface]'))
    await expectWithinViewport(page, page.locator('[data-mobile-nav-toggle]'))
    const dimensions = await page.locator('[data-mobile-nav-surface]').evaluate(element => ({
      port: element.clientHeight,
      row: element.querySelector('[data-mobile-nav-link]')?.getBoundingClientRect().height ?? Infinity
    }))

    expect(dimensions.port).toBeGreaterThanOrEqual(dimensions.row)
  })
}
