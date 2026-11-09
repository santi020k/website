import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const article = '/blog/write-better-review-feedback-with-conventional-comments/'
const chapterName = 'Why this works so well'
const firstSection = 'they-make-comments-more-actionable'
const nextSection = 'they-lower-social-friction'

const openContents = async (page: Page) => {
  const opener = page.locator('[data-post-mobile-toc] [data-toc-opener]')

  if (await opener.isVisible()) {
    // Tracking an inner chapter must never open the reader's outer disclosure.
    await expect(opener).not.toHaveAttribute('open')
    await opener.locator('[data-toc-summary]').focus()
    await page.keyboard.press('Enter')
    await expect(opener).toHaveAttribute('open', '')
  }

  return page.getByRole('navigation', { name: 'Table of contents', exact: true })
}

const openChapter = async (chapter: Locator) => {
  // The incoming fragment can open the chapter while the test is setting up.
  await chapter.evaluate(element => {
    if (!(element instanceof HTMLDetailsElement)) return

    const summary = element.querySelector('summary')

    summary?.focus({ preventScroll: true })
    if (!element.open) summary?.click()
  })
}

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`article chapters reuse the shared navigation at ${width}px, ${textSize}% text, ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto(`${article}#${firstSection}`)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const navigation = await openContents(page)
        const chapter = navigation.locator('[data-chapter-group]')

        await expect(navigation).toHaveCount(1)
        await expect(chapter).toHaveCount(1)
        await expect(chapter.locator('summary')).toHaveText(chapterName)
        await openChapter(chapter)
        await expect(chapter).toHaveAttribute('open', '')
        await expect(chapter.getByRole('link', { name: `Chapter overview: ${chapterName}`, exact: true }))
          .toHaveAttribute('href', '#why-this-works-so-well')
        await chapter.locator(`a[href="#${firstSection}"]`).click()
        await openContents(page)
        await expect(chapter.locator(`a[href="#${firstSection}"]`)).toHaveAttribute('aria-current', 'location')
        await chapter.locator('summary').focus()
        await page.keyboard.press('Space')
        await expect(chapter).not.toHaveAttribute('open')
        await page.evaluate(() => {
          scrollBy(0, 1)
        })
        await expect(chapter).not.toHaveAttribute('open')
        await page.locator(`#${nextSection}`).evaluate(element => {
          element.scrollIntoView()
        })
        await expect(chapter.locator(`a[href="#${nextSection}"]`)).toHaveAttribute('aria-current', 'location')
        await expect(chapter).toHaveAttribute('open', '')
        await chapter.getByRole('link', { name: 'They make review easier to scan', exact: true }).focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(/#they-make-review-easier-to-scan$/u)
        await expect(page.locator('#they-make-review-easier-to-scan')).toBeInViewport()
        await openContents(page)
        expect(await navigation.locator('a, summary').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await expectNoUnexpectedAccessibilityViolations(page)
      })
    }
  }
}

test('an incoming article fragment reveals its chapter without opening the mobile disclosure', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(`${article}#${firstSection}`)
  const opener = page.locator('[data-post-mobile-toc] [data-toc-opener]')

  await expect(opener).not.toHaveAttribute('open')
  await expect(opener.locator('[data-chapter-group]')).toHaveAttribute('open', '')
  await expect(opener.locator(`a[href="#${firstSection}"]`)).toHaveAttribute('aria-current', 'location')
})

for (const width of [390, 1440]) {
  test(`article chapters expose native section links without JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width, height: 900 } })
    const page = await context.newPage()

    try {
      await page.goto(article)
      const navigation = await openContents(page)
      const chapter = navigation.locator('[data-chapter-group]')

      await chapter.locator('summary').focus()
      await page.keyboard.press('Enter')
      await chapter.getByRole('link', { name: 'They lower social friction', exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(new RegExp(`#${nextSection}$`, 'u'))
      await expect(page.locator(`#${nextSection}`)).toBeInViewport()
    } finally {
      await context.close()
    }
  })
}
