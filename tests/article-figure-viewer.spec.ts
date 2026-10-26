import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/blog/migrate-eslint-8-or-less-to-eslint-9/'

test.use({ reducedMotion: 'reduce' })

for (const theme of ['light', 'dark']) {
  for (const width of [320, 1440]) {
    test(`article viewer preserves the caption and inspects artwork at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(route)
      const figure = page.locator('[data-article-figure="1"]')
      const original = figure.locator(':scope > img')
      const viewer = figure.locator('gallery-viewer')
      const opener = viewer.getByRole('button', { name: 'View larger: From layers to flat config.' })
      const dialog = viewer.getByRole('dialog')
      const canvas = viewer.locator('[data-gallery-canvas]')

      await expect(figure.locator('[data-figure-caption]')).toHaveText('From layers to flat config.')
      await expect(canvas.locator('img')).toHaveCount(0)
      await opener.click()
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
      await expect(viewer.locator('[data-gallery-status]')).toHaveText('Complete image')
      await expect(dialog.getByRole('heading')).toHaveText('From layers to flat config.')
      const image = dialog.getByRole('img')

      await expect(image).toHaveAttribute('src', await original.getAttribute('src') ?? '')
      await expect(image).toHaveAttribute('alt', await original.getAttribute('alt') ?? '')
      expect(await image.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        const available = element.parentElement?.getBoundingClientRect()

        return available && bounds.width <= available.width + 1 && bounds.height <= available.height + 1
      })).toBe(true)
      await expectNoUnexpectedAccessibilityViolations(page)
      await dialog.getByRole('button', { name: 'Inspect detail', exact: true }).click()
      await expect(canvas).toHaveAttribute('data-zoomed', 'true')
      expect(await image.evaluate(element => element instanceof HTMLImageElement &&
        Math.abs(element.clientWidth - element.naturalWidth) < 1)).toBe(true)
      await page.keyboard.press('ArrowRight')
      expect(await canvas.evaluate(element => element.scrollLeft)).toBeCloseTo(
        await canvas.evaluate(element => Math.min(100, element.scrollWidth - element.clientWidth)), 0
      )
      await page.keyboard.press('/')
      await page.keyboard.press('Control+k')
      await expect(page.locator('dialog[open]')).toHaveCount(1)
      await dialog.getByRole('button', { name: 'Fit image', exact: true }).click()
      await expect(canvas).toHaveAttribute('data-zoomed', 'false')
      expect(await canvas.evaluate(element => element.scrollLeft + element.scrollTop)).toBe(0)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(opener).toBeFocused()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  }
}

for (const width of [320, 1440]) {
  test(`200% text keeps the article viewer usable in a short ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 })
    await page.goto(route)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    const viewer = page.locator('[data-article-figure="1"] gallery-viewer')
    const opener = viewer.locator('[data-gallery-open]')

    await expect(opener).toBeVisible()
    expect(await opener.evaluate(element => {
      const bounds = element.getBoundingClientRect()

      return bounds.width >= 44 && bounds.height >= 44 && bounds.left >= 0 && bounds.right <= innerWidth
    })).toBe(true)
    await opener.click()
    const dialog = viewer.getByRole('dialog')
    const close = dialog.getByRole('button', { name: 'Close', exact: true })

    await expect(close).toBeInViewport()
    await dialog.getByRole('button', { name: 'Inspect detail', exact: true }).click()
    await expect(close).toBeInViewport()
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(opener).toBeFocused()
  })
}

test('each illustration uses its own optimized image and retries failures on reopen', async ({ page }) => {
  await page.goto(route)
  const figures = page.locator('[data-article-figure]')

  await expect(figures).toHaveCount(2)
  const second = figures.nth(1)
  const source = await second.locator(':scope > img').getAttribute('src')
  const imageURL = new URL(source ?? '', page.url()).href

  await page.route(imageURL, request => request.abort())
  await second.locator('[data-gallery-open]').click()
  await expect(second.getByRole('dialog').getByRole('heading')).toHaveText('A clearer path to flat config.')
  await expect(second.locator('[data-gallery-status]')).toContainText('The preview could not load')
  const recovery = second.getByRole('link', { name: 'Open original image', exact: true })

  await expect(recovery).toHaveAttribute('href', imageURL)
  await expect(recovery).toHaveAttribute('rel', /noopener/u)
  await expect(recovery).toHaveAttribute('rel', /noreferrer/u)
  await expect(second.getByRole('button', { name: 'Inspect detail', exact: true })).toHaveCount(0)
  await second.getByRole('button', { name: 'Close', exact: true }).click()
  await page.unroute(imageURL)
  await second.locator('[data-gallery-open]').click()
  await expect(second.locator('[data-gallery-status]')).toHaveText('Complete image')
  await expect(figures.first().locator('[data-gallery-canvas] img')).toHaveCount(0)
})

test('MDX illustrations use the same viewer, including after client navigation and Back', async ({ page }) => {
  await page.goto('/blog/storybook-in-action-with-next-js-tailwind-and-typescript/')
  const viewer = page.locator('[data-article-figure] gallery-viewer')

  await expect(viewer).toHaveCount(1)
  await viewer.locator('[data-gallery-open]').click()
  await expect(viewer.getByRole('dialog').getByRole('heading')).toHaveText('One component. Every variation.')
  await expect(viewer.locator('[data-gallery-status]')).toHaveText('Complete image')
  await page.keyboard.press('Escape')
  await page.locator('[data-post-final-return] a[href="/blog/"]').click()
  await expect(page).toHaveURL('/blog/')
  await page.goBack()
  await expect(viewer).toHaveCount(1)
  await viewer.locator('[data-gallery-open]').click()
  await expect(viewer.locator('[data-gallery-status]')).toHaveText('Complete image')
  await page.keyboard.press('Escape')
  await expect(viewer.locator('[data-gallery-open]')).toBeFocused()
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('complete Caption spread illustrations stay readable without inactive viewer controls', async ({ page }) => {
    await page.goto(route)
    const figure = page.locator('[data-article-figure]').first()

    await expect(figure.locator(':scope > img')).toBeVisible()
    await expect(figure.locator('[data-figure-caption]')).toHaveText('From layers to flat config.')
    await expect(page.getByRole('button', { name: /^View larger:/u })).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
