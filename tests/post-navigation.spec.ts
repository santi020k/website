import { expect, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/blog/responsive-design-standards-that-scale-across-components/'
const destinationName = 'Standardize the language first'
const fragment = '#standardize-the-language-first'

const expectNavigationPlacement = async (page: Page, browserName: string) => {
  const opener = page.locator('[data-post-mobile-toc]')
  const desktop = page.locator('[data-post-desktop-toc]')
  const stacked = await page.locator('[data-reading-body]').evaluate(element => (
    getComputedStyle(element).gridTemplateColumns.split(' ').length === 1
  ))

  if (stacked) {
    await expect(opener).toBeVisible()
    await expect(desktop).toBeHidden()
    await expect(opener.locator('[data-toc-count]')).toHaveText('1 of 7')
    await expect(page.getByRole('navigation', { name: 'Table of contents', exact: true })).toHaveCount(0)
    expect(await opener.evaluate(element => {
      const notes = document.querySelector('[data-article-margin-lead]')

      return notes !== null && element.getBoundingClientRect().bottom <= notes.getBoundingClientRect().top &&
        Boolean(element.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    await opener.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(opener.locator('details')).toHaveAttribute('open', '')
    const nextKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'

    await page.keyboard.press(nextKey)
    // Firefox may include the scrollable contents pane in the native tab order.
    if (await opener.locator('reading-contents').evaluate(element => document.activeElement === element)) {
      await page.keyboard.press(nextKey)
    }
    await expect(opener.getByRole('link').first()).toBeFocused()
  } else {
    await expect(opener).toBeHidden()
    await expect(desktop).toBeVisible()
  }
}

const closeOpener = async (page: Page) => {
  const opener = page.locator('[data-post-mobile-toc]')

  if (!await opener.isVisible() || await opener.locator('details').getAttribute('open') === null) return

  await opener.locator('summary').focus()
  await page.keyboard.press('Space')
  await expect(opener.locator('details')).not.toHaveAttribute('open', '')
  await expect(page.getByRole('navigation', { name: 'Table of contents', exact: true })).toHaveCount(0)
}

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 390, 768, 1024, 1440]) {
  for (const textSize of [100, 200]) {
    test(`article contents follow the reading layout at ${width}px and ${textSize}% text`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = `${size}%`
        await document.fonts.ready
      }, textSize)

      await expectNavigationPlacement(page, browserName)

      const navigation = page.getByRole('navigation', { name: 'Table of contents', exact: true })
      await expect(navigation).toHaveCount(1)
      await expect(navigation.getByRole('link')).toHaveCount(7)
      const destination = navigation.getByRole('link', { name: destinationName, exact: true })

      await destination.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(new RegExp(`${fragment}$`, 'u'))
      await expect(page.locator(fragment)).toBeInViewport()
      const selected = page.locator(`[data-post-mobile-toc] a[href="${fragment}"], [data-post-desktop-toc] a[href="${fragment}"]`)

      await expect(selected.first()).toHaveAttribute('aria-current', 'location')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

      await closeOpener(page)
    })
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`article navigation switches without duplicate accessible links in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(route)
    await page.locator('[data-post-mobile-toc] summary').click()
    await expectNoUnexpectedAccessibilityViolations(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.locator('[data-post-mobile-toc]')).toBeHidden()
    await expect(page.locator('[data-post-desktop-toc]')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Table of contents', exact: true })).toHaveCount(1)
    await expectNoUnexpectedAccessibilityViolations(page)
    await page.setViewportSize({ width: 390, height: 900 })
    await expect(page.locator('[data-post-desktop-toc]')).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Table of contents', exact: true })).toHaveCount(1)
  })
}

test('article opener and fragment navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(route)
  await page.locator('[data-post-mobile-toc] summary').click()
  const navigation = page.getByRole('navigation', { name: 'Table of contents', exact: true })

  await expect(navigation.getByRole('link')).toHaveCount(7)
  await navigation.getByRole('link', { name: destinationName, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${fragment}$`, 'u'))
  await expect(page.locator(fragment)).toBeInViewport()
  await context.close()
})
