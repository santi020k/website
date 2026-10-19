import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  test(`organization cards remain still in the ${theme} sculpted layout`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/about/')
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme
    }, theme)
    const card = page.locator('[data-carousel-item] a').first()

    await card.hover()
    const position = await card.evaluate(element => ({
      translate: getComputedStyle(element).translate,
      transform: getComputedStyle(element).transform
    }))

    expect(position).toEqual({ translate: 'none', transform: 'none' })
  })

  for (const [path, selector] of [
    ['/about/', '[data-carousel-item] a'],
    ['/portfolio/', '[data-portfolio-project] > a'],
    ['/blog/tags/', '#tags-list a'],
    ['/blog/tags/', '#tag-filter'],
    ['/technologies/', '#technology-filter']
  ] as const) {
    test(`forced colors retain focus on ${selector} in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
      await page.goto(path)
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme
      }, theme)
      const target = page.locator(selector).first()

      // Keyboard modality makes :focus-visible applicable to link targets too.
      await page.keyboard.press('Tab')
      await target.focus()
      await expect(target).toBeFocused()
      const outline = await target.evaluate(element => {
        const style = getComputedStyle(element)

        return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
      })

      expect(outline.style).toBe('solid')
      expect(outline.width).toBeGreaterThanOrEqual(2)
    })
  }
}

test('reduced motion keeps organization images and arrows still on hover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/about/')
  const card = page.locator('[data-carousel-item] a').first()
  const transforms = () => card.evaluate(element => [...element.querySelectorAll('img, .ui-icon')]
    .map(child => ({ scale: getComputedStyle(child).scale, translate: getComputedStyle(child).translate })))
  const before = await transforms()

  await card.hover()
  expect(await transforms()).toEqual(before)
})

test('reduced motion keeps post preview arrows still on hover', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/blog/')
  const card = page.locator('[data-post-gallery-card]').first()
  const arrow = card.locator('.lucide-arrow-right').last()
  const before = await arrow.evaluate(element => getComputedStyle(element.closest('.ui-icon') ?? element).translate)

  await card.hover()
  expect(await arrow.evaluate(element => getComputedStyle(element.closest('.ui-icon') ?? element).translate)).toBe(before)
})

test('reduced motion keeps article and project hero covers still on hover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const route of ['/blog/building-the-best-next-js-typescript-standard-vitest-eslint-configuration/', '/portfolio/smith-commerce/']) {
    await page.goto(route)
    const cover = page.locator('[data-post-cover] img, [data-project-cover] img').first()
    const before = await cover.evaluate(element => getComputedStyle(element).scale)

    await page.locator('[data-post-cover] .group, [data-project-cover] .group').first().hover()
    expect(await cover.evaluate(element => getComputedStyle(element).scale)).toBe(before)
  }
})
