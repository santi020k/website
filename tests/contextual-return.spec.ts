import { expect, type Page, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'

const showClosingReturn = async (page: Page) => {
  await page.locator('[data-return-top]').evaluate(element => {
    scrollTo({ top: element.getBoundingClientRect().bottom + scrollY - innerHeight + 10, behavior: 'instant' })
  })
  await expect(page.locator('[data-return-top]')).toBeInViewport({ ratio: 1 })
}

test.use({ reducedMotion: 'reduce' })

for (const route of [article, `/es${article}`, '/portfolio/smith-commerce/', '/es/portfolio/smith-commerce/']) {
  test(`the floating return yields and restores around the closing link on ${route}`, async ({ page }) => {
    await page.goto(route)
    const floating = page.locator('#back-to-top')
    const closing = page.locator('[data-return-top]')

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 844 })
      for (const size of ['100%', '200%']) {
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = value
          await document.fonts.ready
        }, size)
        await showClosingReturn(page)
        await expect(floating).toBeHidden()
        await expect(floating).toHaveAttribute('inert', '')
        await closing.click({ trial: true })
        await page.evaluate(() => {
          scrollBy({ top: -innerHeight, behavior: 'instant' })
        })
        await expect(closing).not.toBeInViewport()
        await expect(floating).toBeVisible()
        await expect(floating).not.toHaveAttribute('inert')
      }
    }
  })
}

test('the return follows viewport changes and is restored below the closing links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(article)
  const floating = page.locator('#back-to-top')
  await showClosingReturn(page)
  await expect(floating).toBeHidden()
  await page.setViewportSize({ width: 390, height: 600 })
  await expect(page.locator('[data-return-top]')).not.toBeInViewport()
  await expect(floating).toBeVisible()
  await showClosingReturn(page)
  await expect(floating).toBeHidden()
  await page.evaluate(() => {
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
  })
  await expect(page.locator('[data-return-top]')).not.toBeInViewport()
  await expect(floating).toBeVisible()
})

test('a focused floating return stays operable and yields after focus leaves', async ({ page }) => {
  await page.goto(article)
  const floating = page.locator('#back-to-top')
  await page.evaluate(() => {
    scrollTo({ top: 600, behavior: 'instant' })
  })
  await expect(floating).toBeVisible()
  await floating.focus()
  await showClosingReturn(page)
  await expect(floating).toBeVisible()
  await expect(floating).toBeFocused()
  await floating.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await expect(floating).toBeHidden()

  await page.evaluate(() => {
    scrollTo({ top: 600, behavior: 'instant' })
  })
  await expect(floating).toBeVisible()
  await floating.focus()
  await showClosingReturn(page)
  await page.locator('[data-return-top]').focus()
  await expect(floating).toBeHidden()
  await expect(floating).toHaveAttribute('inert', '')
  await expect(page.locator('[data-return-top]')).toBeFocused()
})

test('route swaps replace the closing-return context', async ({ page }) => {
  await page.goto(article)
  const floating = page.locator('#back-to-top')
  for (let visit = 0; visit < 2; visit += 1) {
    await showClosingReturn(page)
    await expect(floating).toBeHidden()
    await page.locator('[data-return-link]').click()
    await expect(page).toHaveURL('/blog/')
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
    await expect(page.locator('[data-return-top]')).toHaveCount(0)
    await page.evaluate(() => {
      scrollTo({ top: 600, behavior: 'instant' })
    })
    await expect(floating).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(article)
  }
})

test('scroll and resize retain the return behavior without IntersectionObserver', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { value: undefined, configurable: true })
  })
  await page.goto(article)
  await showClosingReturn(page)
  await expect(page.locator('#back-to-top')).toBeHidden()
  await page.evaluate(() => {
    scrollBy({ top: -innerHeight, behavior: 'instant' })
  })
  await expect(page.locator('#back-to-top')).toBeVisible()
})

test.describe('Closing return without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const route of [article, `/es${article}`]) {
    test(`the native closing link remains usable on ${route}`, async ({ page }) => {
      await page.goto(route)
      const closing = page.locator('[data-return-top]')
      await closing.scrollIntoViewIfNeeded()
      await expect(page.locator('#back-to-top')).toBeHidden()
      await closing.press('Enter')
      await expect(page).toHaveURL(/#main$/u)
      await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    })
  }
})
