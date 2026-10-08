import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

// Record real native animations without replacing their behavior or sampling a short-lived frame.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const animate: unknown = Object.getOwnPropertyDescriptor(Element.prototype, 'animate')?.value
    if (typeof animate !== 'function') throw new TypeError('Native animation API is unavailable')
    Element.prototype.animate = function (
      this: Element,
      keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions
    ): Animation {
      const root = this.parentElement
      if (this.hasAttribute('data-ui-motion-key') && root?.id === 'tags-list') {
        root.dataset.observedMotionCount = String(Number(root.dataset.observedMotionCount ?? 0) + 1)
      }
      const animation: unknown = Reflect.apply(animate, this, [keyframes, options])
      if (!(animation instanceof Animation)) throw new TypeError('Native animation did not return an Animation')
      return animation
    }
  })
})

test('topic sorting animates stable identities and retains control focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/blog/tags/')
  const list = page.locator('#tags-list[data-ui-motion-group]')
  const sort = page.locator('[data-sort-btn="alpha"]')
  await expect(list).toBeVisible()
  const keys = await list.locator(':scope > [data-ui-motion-key]').evaluateAll(items => items.map(item => item.getAttribute('data-ui-motion-key')))
  expect(new Set(keys).size).toBe(keys.length)
  await expect.poll(() => page.evaluate(async () => {
    const control = document.querySelector<HTMLButtonElement>('[data-sort-btn="alpha"]')
    if (!control) throw new Error('Missing topic sort control')
    const countControl = document.querySelector<HTMLButtonElement>('[data-sort-btn="count"]')
    if (!countControl) throw new Error('Missing topic count control')
    countControl.click()
    await new Promise<void>(resolve => requestAnimationFrame(() => {
      resolve()
    }))
    control.click()
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
    return Number(document.getElementById('tags-list')?.dataset.observedMotionCount ?? 0) > 0
  })).toBe(true)
  await page.locator('[data-sort-btn="count"]').click()
  await sort.focus()
  await page.keyboard.press('Enter')
  await expect(sort).toBeFocused()
  const sorted = await list.locator(':scope > [data-label]:not([data-ui-motion-ghost])').evaluateAll(items => items.map(item => item.getAttribute('data-label') ?? ''))
  expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)))
  await page.locator('#tag-filter').fill('accessibility')
  await expect(page.locator('#tag-filter-status')).toHaveText('1 topic found.')
  await expectNoUnexpectedAccessibilityViolations(page)
})

test('metrics and disclosures retain final content with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const outputs = page.locator('#home-stats [data-ui-animated-number-output]')
  await expect(outputs).toHaveText(['12+', '14', '-75%', '100+'])
  await expect(page.locator('#home-stats [data-ui-animated-number] .ui-sr-only'))
    .toHaveText(['12+', '14', '-75%', '100+'])
  await page.goto('/blog/tags/')
  await page.locator('[data-sort-btn="alpha"]').click()
  expect(await page.locator('#tags-list').getAttribute('data-observed-motion-count')).toBeNull()
  await page.goto('/portfolio/lumen-ui/')
  const disclosure = page.locator('section[aria-labelledby="sidebar-stack"] details')
  await disclosure.locator('summary').click()
  await expect(disclosure).toHaveAttribute('open', '')
  expect(await disclosure.evaluate(element => getComputedStyle(element, '::details-content').transitionDuration)).toMatch(/^0s(?:, 0s)*$/)
})

test('animated metrics and framed product image remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('#home-stats [data-ui-animated-number-output]')).toHaveText(['12+', '14', '-75%', '100+'])
  await page.goto('/portfolio/void/')
  const image = page.locator('[data-ui-device-screen] img[alt="Void home experience"]')
  await expect(image).toBeVisible()
  await image.scrollIntoViewIfNeeded()
  await expect.poll(() => image.evaluate(element => (
    element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
  ))).toBe(true)
  const geometry = await image.evaluate(element => {
    const screen = element.closest('[data-ui-device-screen]')
    if (!screen) throw new Error('Product screenshot must be inside its device screen')
    const imageRect = element.getBoundingClientRect()
    const screenRect = screen.getBoundingClientRect()
    return {
      heightDifference: Math.abs(imageRect.height - screenRect.height),
      topOffset: Math.abs(imageRect.top - screenRect.top)
    }
  })
  expect(geometry.topOffset).toBeLessThanOrEqual(1)
  expect(geometry.heightDifference).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})
