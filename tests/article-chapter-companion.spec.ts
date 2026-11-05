import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const section = '#test-the-whole-dialog-focus-cycle'
const nextSection = '#keyboard-testing-checklist'

test.use({ reducedMotion: 'reduce' })

test('an incoming section link clears the companion and keeps the selected chapter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${article}${section}`)
  await page.evaluate(() => document.fonts.ready)
  const holder = page.locator('[data-post-mobile-toc]')

  await expect(holder.locator('[data-toc-current]')).toHaveText('Test the whole dialog focus cycle')
  await expect.poll(() => page.locator(section).evaluate(element => {
    const summary = document.querySelector('[data-toc-summary]')

    return summary !== null && element.getBoundingClientRect().top >= summary.getBoundingClientRect().bottom
  })).toBe(true)
  await expect(holder.locator('[data-toc-opener]')).not.toHaveAttribute('open')
})

for (const theme of ['light', 'dark'] as const) {
  test(`the mobile companion follows the article and closes at a selected section in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(article)
    await page.evaluate(() => document.fonts.ready)
    const holder = page.locator('[data-post-mobile-toc]')
    const opener = holder.locator('[data-toc-opener]')
    const summary = holder.locator('[data-toc-summary]')

    await expect(holder).toHaveAttribute('data-companion-sticky')
    await page.locator(section).evaluate(element => {
      element.scrollIntoView({ behavior: 'instant' })
    })
    await expect(summary).toBeInViewport({ ratio: 1 })
    await expect(holder.locator('[data-toc-current]')).toHaveText('Test the whole dialog focus cycle')
    await expect(holder.locator('[data-toc-count]')).toHaveText('3 of 6')
    const before = await page.locator(section).evaluate(element => element.getBoundingClientRect().top)

    await summary.click()
    await expect(opener).toHaveAttribute('open')
    expect(await page.locator(section).evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(before, 0)
    await holder.locator(`a[href="${nextSection}"]`).click()
    await expect(page).toHaveURL(new RegExp(`${nextSection}$`, 'u'))
    await expect(opener).not.toHaveAttribute('open')
    await expect(page.locator(nextSection)).toBeFocused()
    await expect(holder.locator('[data-toc-count]')).toHaveText('5 of 6')
    expect(await page.locator(nextSection).evaluate(element => {
      const companion = document.querySelector('[data-toc-summary]')

      return companion !== null && element.getBoundingClientRect().top >= companion.getBoundingClientRect().bottom
    })).toBe(true)
    await summary.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')
    await expect(opener).not.toHaveAttribute('open')
    await expect(summary).toBeFocused()
    await expectNoUnexpectedAccessibilityViolations(page)

    await page.locator(nextSection).focus()
    await page.locator('[data-post-continuation]').evaluate(element => {
      element.scrollIntoView({ behavior: 'instant' })
    })
    await expect(summary).toBeHidden()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const size of [100, 200]) {
  test(`contents remain usable with ${size}% text and a small viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto(`${article}${section}`)
    await page.evaluate(async scale => {
      document.documentElement.style.fontSize = `${scale}%`
      await document.fonts.ready
    }, size)
    const holder = page.locator('[data-post-mobile-toc]')
    const summary = holder.locator('[data-toc-summary]')

    await summary.focus()
    await page.keyboard.press('Enter')
    const lastLink = holder.getByRole('link').last()

    await lastLink.focus()
    await expect(lastLink).toBeInViewport({ ratio: 1 })
    await page.keyboard.press('Enter')
    await expect(holder.locator('[data-toc-opener]')).not.toHaveAttribute('open')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.setViewportSize({ width: 568, height: 320 })
    await expect(holder).not.toHaveAttribute('data-companion-sticky')
  })
}

test('the desktop rail stays shared and the companion follows language navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(article)
  await expect(page.locator('[data-post-mobile-toc]')).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Table of contents', exact: true })).toHaveCount(1)
  await page.locator('[data-language-switch="header"]').click()
  await page.setViewportSize({ width: 390, height: 844 })
  const holder = page.locator('[data-post-mobile-toc]')

  await expect(holder.locator('[data-toc-count]')).toHaveText('1 de 6')
  await holder.locator('[data-toc-summary]').click()
  await expect(page.getByRole('navigation', { name: 'Tabla de contenido', exact: true })).toHaveCount(1)
})

test('without JavaScript the existing native opener remains in normal flow', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })

  try {
    const page = await context.newPage()

    await page.goto(article)
    const holder = page.locator('[data-post-mobile-toc]')

    await expect(holder).not.toHaveAttribute('data-companion-sticky')
    await expect(holder.locator('[data-toc-current]')).toBeHidden()
    await holder.locator('[data-toc-summary]').click()
    await holder.locator(`a[href="${nextSection}"]`).click()
    await expect(page).toHaveURL(new RegExp(`${nextSection}$`, 'u'))
    await expect(page.locator(nextSection)).toBeInViewport()
  } finally {
    await context.close()
  }
})
