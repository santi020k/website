import { expect, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/portfolio/smith-commerce/'

for (const width of [320, 375, 390, 1440]) {
  for (const textSize of [100, 200]) {
    test(`preview enhancement preserves control size at ${width}px with ${textSize}% text`, async ({ browser, page }) => {
      const fallbackContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } })
      const fallbackPage = await fallbackContext.newPage()

      try {
        await page.setViewportSize({ width, height: 900 })
        const measureControls = async (target: Page, role: 'link' | 'button') => {
          await target.goto('/portfolio/lumen-ui/')
          await target.evaluate(async size => {
            document.documentElement.style.fontSize = `${size}%`
            await document.fonts.ready
          }, textSize)
          const controls = target.locator('[data-gallery-actions]').getByRole(role, { name: /^View larger:/u })

          await expect(controls).toHaveCount(2)
          await expect(controls.first()).toBeVisible()

          return controls.evaluateAll(elements => elements.map(element => {
            const bounds = element.getBoundingClientRect()

            return { width: bounds.width, height: bounds.height, fits: bounds.left >= 0 && bounds.right <= innerWidth }
          }))
        }
        const fallback = await measureControls(fallbackPage, 'link')
        const enhanced = await measureControls(page, 'button')

        expect(fallback.every(control => control.fits)).toBe(true)
        expect(enhanced).toEqual(fallback)
      } finally {
        await fallbackContext.close()
      }
    })
  }
}

const waitForPageLoad = (page: Page, pathname: string) => page.evaluate(destination => new Promise<void>(resolve => {
  const loaded = () => {
    if (location.pathname !== destination) return
    document.removeEventListener('astro:page-load', loaded)
    resolve()
  }

  document.addEventListener('astro:page-load', loaded)
}), pathname)

for (const slug of ['smith-commerce', 'lumen-ui', 'postlens']) {
  for (const theme of ['light', 'dark']) {
    for (const width of [320, 1440]) {
      test(`${slug} viewer fits and inspects screenshots at ${width}px in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.goto(`/portfolio/${slug}/#inside-the-product`)
        const viewer = page.locator('[data-product-previews] project-preview-viewer').first()
        const opener = viewer.getByRole('button', { name: /^View larger:/u })
        const dialog = viewer.getByRole('dialog')

        await opener.click()
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
        await expect(dialog.locator('[data-gallery-status]')).toHaveText('Complete image')
        const image = dialog.getByRole('img')
        const canvas = dialog.getByRole('region', { name: /^Image:/u })
        const fitted = await image.boundingBox()
        const available = await canvas.boundingBox()

        expect(fitted).not.toBeNull()
        expect(available).not.toBeNull()
        expect(fitted?.width).toBeLessThanOrEqual(available?.width ?? 0)
        expect(fitted?.height).toBeLessThanOrEqual((available?.height ?? 0) + 1)
        await expect(image).toHaveCSS('object-fit', 'contain')
        await expectNoUnexpectedAccessibilityViolations(page)

        // The name states the next action, so the control is not a pressed toggle.
        const inspect = dialog.getByRole('button', { name: 'Inspect detail', exact: true })
        const fit = dialog.getByRole('button', { name: 'Fit image', exact: true })

        await expect(inspect).not.toHaveAttribute('aria-pressed')
        await inspect.click()
        await expect(canvas).toHaveAttribute('data-zoomed', 'true')
        await expect(fit).not.toHaveAttribute('aria-pressed')
        await expect(inspect).toHaveCount(0)
        expect(await image.evaluate(element => (
          element instanceof HTMLImageElement && Math.abs(element.clientWidth - element.naturalWidth) < 1
        ))).toBe(true)
        const detail = await image.boundingBox()
        const detailCanvas = await canvas.boundingBox()

        // Centering a full-width image hides its left edge outside the scroll range.
        expect(detail?.x).toBeCloseTo(detailCanvas?.x ?? 0, 0)
        expect(detail?.y).toBeCloseTo(detailCanvas?.y ?? 0, 0)
        await page.keyboard.press('ArrowDown')
        await expect.poll(() => canvas.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
        await page.keyboard.press('ArrowRight')
        const horizontal = await canvas.evaluate(element => ({
          actual: element.scrollLeft,
          expected: Math.min(100, element.scrollWidth - element.clientWidth)
        }))

        expect(horizontal.actual).toBeCloseTo(horizontal.expected, 0)
        await canvas.focus()
        await expect(canvas).not.toHaveCSS('outline-style', 'none')
        // The viewer owns its keys, so neither search shortcut opens a second modal.
        for (const shortcut of ['Control+k', 'Meta+k']) {
          await page.keyboard.press(shortcut)
          await expect(page.locator('dialog[open]')).toHaveCount(1)
          await expect(page.locator('#site-search-dialog')).not.toHaveAttribute('open')
          await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'false')
          await expect(canvas).toBeFocused()
        }
        await fit.click()
        await expect(canvas).toHaveAttribute('data-zoomed', 'false')
        await expect(inspect).not.toHaveAttribute('aria-pressed')
        expect(await canvas.evaluate(element => element.scrollTop + element.scrollLeft)).toBe(0)
        // A fitted image may have no scroll range, so check that panning keys stay unhandled.
        expect(await inspect.evaluate(button => ['ArrowDown', 'ArrowRight'].map(key => button.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        )))).toEqual([true, true])
        await inspect.click()
        await expect(fit).toBeVisible()
        const scrollPosition = await page.evaluate(() => scrollY)

        // Closing while zoomed resets the next opening to the fitted image.
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
        await expect(opener).toBeFocused()
        expect(await page.evaluate(() => scrollY)).toBe(scrollPosition)
        await opener.click()
        await expect(dialog.locator('[data-gallery-status]')).toHaveText('Complete image')
        await expect(canvas).toHaveAttribute('data-zoomed', 'false')
        await expect(inspect).not.toHaveAttribute('aria-pressed')
        await expect(fit).toHaveCount(0)
        expect(await canvas.evaluate(element => element.scrollTop + element.scrollLeft)).toBe(0)
        await dialog.getByRole('button', { name: 'Close', exact: true }).click()
        await expect(opener).toBeFocused()
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      })
    }
  }
}

for (const width of [390, 1440]) {
  test(`enlarged text keeps viewer controls reachable on a short ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    const viewer = page.locator('[data-product-previews] project-preview-viewer').first()

    await viewer.getByRole('button', { name: /^View larger:/u }).click()
    const dialog = viewer.getByRole('dialog')
    const close = dialog.getByRole('button', { name: 'Close', exact: true })

    await expect(close).toBeInViewport()
    await dialog.getByRole('button', { name: 'Inspect detail', exact: true }).click()
    await expect(close).toBeInViewport()
    expect(await dialog.evaluate(element => element.scrollWidth > element.clientWidth + 1)).toBe(false)
    await page.keyboard.press('Escape')
    await expect(viewer.getByRole('button', { name: /^View larger:/u })).toBeFocused()
  })
}

test('full-size images load on demand and each viewer keeps its own image and caption', async ({ page }) => {
  const requested = new Set<string>()

  page.on('request', request => requested.add(new URL(request.url()).pathname))
  await page.goto(route)
  const viewers = page.locator('[data-product-previews] project-preview-viewer')
  const fullImages = await viewers.locator('[data-gallery-fallback]').evaluateAll(links => links.map(link => link.getAttribute('href')))

  expect(fullImages.every(src => src !== null && !requested.has(src))).toBe(true)
  const second = viewers.nth(1)

  await second.getByRole('button', { name: /^View larger:/u }).click()
  await expect(second.getByRole('dialog').getByRole('heading')).toHaveText('The same experience on mobile')
  await expect(second.locator('[data-gallery-status]')).toHaveText('Complete image')
  expect(requested.has(fullImages[0] ?? '')).toBe(false)
  expect(requested.has(fullImages[1] ?? '')).toBe(true)
  await expect(second.getByRole('img')).toHaveAttribute('alt', /F.W. Webb mobile storefront/u)
})

test('failed images keep a recovery link and can be retried by reopening', async ({ page }) => {
  await page.goto(route)
  const viewer = page.locator('[data-product-previews] project-preview-viewer').first()
  const fullImage = await viewer.locator('[data-gallery-fallback]').getAttribute('href')

  expect(fullImage).not.toBeNull()
  const imageURL = new URL(fullImage ?? '', page.url()).href

  await page.route(imageURL, request => request.abort())
  await viewer.getByRole('button', { name: /^View larger:/u }).click()
  await expect(viewer.locator('[data-gallery-status]')).toContainText('The preview could not load')
  await expect(viewer.getByRole('link', { name: 'Open original image', exact: true })).toHaveAttribute('href', fullImage ?? '')
  await expect(viewer.getByRole('button', { name: 'Inspect detail', exact: true })).toHaveCount(0)
  await viewer.getByRole('button', { name: 'Close', exact: true }).click()
  await page.unroute(imageURL)
  await viewer.getByRole('button', { name: /^View larger:/u }).click()
  await expect(viewer.locator('[data-gallery-status]')).toHaveText('Complete image')
  await expect(viewer.getByRole('button', { name: 'Inspect detail', exact: true })).toBeEnabled()
})

test('viewer controls reconnect after client navigation and Back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(route)
  const viewer = page.locator('[data-product-previews] project-preview-viewer').first()

  await viewer.getByRole('button', { name: /^View larger:/u }).click()
  await viewer.getByRole('button', { name: 'Close', exact: true }).click()
  await Promise.all([waitForPageLoad(page, '/portfolio/void/'), page.getByRole('link', { name: 'Read case study: Void.GG', exact: true }).click()])
  await expect(page.locator('[data-product-previews] project-preview-viewer')).toHaveCount(0)
  await Promise.all([waitForPageLoad(page, route), page.goBack()])
  await viewer.getByRole('button', { name: /^View larger:/u }).click()
  await expect(viewer.locator('[data-gallery-status]')).toHaveText('Complete image')
  await page.keyboard.press('Escape')
  await expect(viewer.getByRole('button', { name: /^View larger:/u })).toBeFocused()
})

test('without JavaScript, View larger opens the full-size image directly', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  try {
    await page.goto(route)
    const viewer = page.locator('[data-product-previews] project-preview-viewer').first()
    const link = viewer.getByRole('link', { name: /^View larger:/u })

    await expect(viewer.getByRole('button', { name: /^View larger:/u })).toHaveCount(0)
    await expect(link).toHaveAttribute('rel', /noopener/u)
    const href = await link.getAttribute('href')
    const [imagePage] = await Promise.all([context.waitForEvent('page'), link.click()])

    await expect(imagePage).toHaveURL(new URL(href ?? '', page.url()).href)
    await expect(imagePage.getByRole('img')).toBeVisible()
  } finally {
    await context.close()
  }
})
