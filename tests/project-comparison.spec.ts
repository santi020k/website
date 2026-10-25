import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/portfolio/smith-commerce/#before-and-after'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 768, 1440]) {
    test(`comparison preserves both complete screenshots at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      const comparison = page.getByRole('region', { name: 'Marcone before and after' })
      const figures = comparison.locator('figure')

      await expect(figures).toHaveCount(2)
      await expect(comparison.locator('figcaption')).toHaveText(['BeforeLegacy monolith', 'AfterHeadless storefront'])
      for (const textSize of [100, 200]) {
        await page.evaluate(size => {
          document.documentElement.style.fontSize = `${size}%`
        }, textSize)
        await comparison.scrollIntoViewIfNeeded()
        const layout = await comparison.evaluate(element => {
          const before = element.querySelector('[data-comparison-version="before"]')?.getBoundingClientRect()
          const after = element.querySelector('[data-comparison-version="after"]')?.getBoundingClientRect()

          if (!before || !after) throw new Error('Expected both comparison figures')

          const textSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
          const stacked = element.clientWidth < 32.5 * textSize

          return {
            aligned: Math.abs(stacked ? after.x - before.x : after.y - before.y) < 1,
            ordered: stacked ? after.top >= before.bottom : after.left >= before.right
          }
        })

        expect(layout).toEqual({ aligned: true, ordered: true })
        for (const figure of await figures.all()) {
          const image = figure.locator('[data-comparison-image]')

          await image.scrollIntoViewIfNeeded()
          await image.evaluate(element => {
            if (!(element instanceof HTMLImageElement)) throw new Error('Expected comparison image')

            return element.decode()
          })
          await expect(image).toHaveAttribute('loading', 'lazy')
          await expect(image).toHaveAttribute('alt', /Marcone/u)
          await expect(image).toHaveCSS('object-fit', 'contain')
          expect(await image.evaluate(element => (
            element instanceof HTMLImageElement &&
            Math.abs(element.clientWidth / element.clientHeight - element.naturalWidth / element.naturalHeight) < 0.02
          ))).toBe(true)
          await expect(figure.getByRole('button', { name: /^View larger:/u })).toBeVisible()
        }
        expect(await comparison.locator('figcaption, [data-comparison-topline]').evaluateAll(elements => (
          elements.some(element => element.scrollWidth > element.clientWidth + 1)
        ))).toBe(false)
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
        await expectNoUnexpectedAccessibilityViolations(page)
      }
    })
  }
}

for (const width of [390, 1440]) {
  test(`both comparison viewers retain their own images, captions, and focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route)
    const comparison = page.getByRole('region', { name: 'Marcone before and after' })

    for (const { state, title, caption } of [
      { state: 'before', title: 'Legacy monolith', caption: 'Before — Legacy Monolith' },
      { state: 'after', title: 'Headless storefront', caption: 'After — Headless Storefront' }
    ]) {
      const figure = comparison.locator(`[data-comparison-version="${state}"]`)
      const opener = figure.getByRole('button', { name: `View larger: ${title}` })

      await opener.focus()
      await page.keyboard.press('Enter')
      const dialog = figure.getByRole('dialog', { name: title })

      await expect(dialog).toBeVisible()
      await expect(dialog.locator('[data-gallery-status]')).toHaveText('Complete image')
      await expect(dialog.locator('[data-gallery-caption]')).toHaveText(caption)
      await expect(dialog.getByRole('img')).toHaveAttribute('alt', await figure.locator('[data-comparison-image]').getAttribute('alt') ?? '')
      await dialog.getByRole('button', { name: 'Inspect detail', exact: true }).click()
      const canvas = dialog.locator('[data-gallery-canvas]')

      await page.keyboard.press('ArrowRight')
      await expect.poll(() => canvas.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
      await page.keyboard.press('Escape')
      await expect(opener).toBeFocused()
    }
    const gallery = page.locator('[data-product-previews] project-preview-viewer').first()

    await gallery.getByRole('button', { name: /^View larger:/u }).click()
    await expect(gallery.getByRole('dialog').getByRole('heading')).toHaveText('A new storefront, built for discovery')
    await page.keyboard.press('Escape')
    const ids = await page.locator('dialog[id]').evaluateAll(elements => elements.map(element => element.id))

    expect(new Set(ids).size).toBe(ids.length)
  })
}

test('the comparison stays in the Marcone chapter without extra navigation headings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(route)
  const chapter = page.locator('[data-project-chapters] details').filter({ has: page.locator('a[href="#before-and-after"]') })

  await expect(chapter.locator('summary')).toHaveText('Marcone: rebuilding for a headless future')
  await expect(chapter.locator('a[href="#before-and-after"]')).toHaveAttribute('aria-current', 'location')
  await expect(page.locator('[data-project-chapters]').getByRole('link', { name: /Legacy monolith|Headless storefront/u })).toHaveCount(0)
  expect(await page.locator('#marcone-comparison').evaluate(element => {
    let sibling = element.previousElementSibling

    while (sibling && !sibling.matches('h3, [data-project-section-heading]')) sibling = sibling.previousElementSibling

    return sibling?.matches('h3') ? sibling.id : sibling?.querySelector('h3')?.id
  })).toBe('before-and-after')
})

test('comparison images and original-image links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } })
  const page = await context.newPage()

  try {
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)
    const comparison = page.getByRole('region', { name: 'Marcone before and after' })

    await expect(comparison.getByRole('img')).toHaveCount(2)
    await expect(comparison.getByRole('button', { name: /^View larger:/u })).toHaveCount(0)
    for (const link of await comparison.getByRole('link', { name: /^View larger:/u }).all()) {
      expect((await link.getAttribute('rel'))?.split(/\s+/u)).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
      const [popup] = await Promise.all([context.waitForEvent('page'), link.click()])

      await expect(popup.getByRole('img')).toBeVisible()
      await popup.close()
    }
  } finally {
    await context.close()
  }
})
