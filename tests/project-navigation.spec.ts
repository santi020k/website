import { expect, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/portfolio/smith-commerce/'

const openTechnicalChapter = async (page: Page) => {
  const chapter = page.locator('[data-project-desktop-toc] details').filter({ has: page.locator('a[href="#technical-highlights"]') })

  if (await chapter.isVisible() && await chapter.getAttribute('open') === null) await chapter.locator('summary').click()
}

const expectNavigationPlacement = async (page: Page, browserName: string) => {
  const opener = page.locator('[data-project-mobile-toc]')
  const desktop = page.locator('[data-project-desktop-toc]')
  const summary = opener.locator('summary')
  const stacked = await page.locator('[data-reading-body]').evaluate(element => (
    getComputedStyle(element).gridTemplateColumns.split(' ').length === 1
  ))

  if (stacked) {
    await expect(opener).toBeVisible()
    await expect(desktop).toBeHidden()
    await expect(summary).toHaveText('On this page 4 sections')
    await expect(page.getByRole('navigation', { name: 'Table of contents' })).toHaveCount(0)
    expect(await opener.evaluate(element => {
      const notes = document.querySelector('[data-project-context-lead], [data-content-notes]')

      return notes !== null && Boolean(element.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(opener.locator('details')).toHaveAttribute('open', '')
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(opener.getByRole('link').first()).toBeFocused()
  } else {
    await expect(opener).toBeHidden()
    await expect(desktop).toBeVisible()
  }
}

const closeOpener = async (page: Page) => {
  const opener = page.locator('[data-project-mobile-toc]')

  if (!await opener.isVisible()) return

  await opener.locator('summary').focus()
  await page.keyboard.press('Space')
  await expect(opener.locator('details')).not.toHaveAttribute('open', '')
  await expect(page.getByRole('navigation', { name: 'Table of contents' })).toHaveCount(0)
}

for (const width of [320, 390, 1024, 1440]) {
  for (const textSize of [100, 200]) {
    test(`project navigation follows the reading layout at ${width}px and ${textSize}% text`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = `${size}%`
        await document.fonts.ready
      }, textSize)

      await expectNavigationPlacement(page, browserName)

      const navigation = page.getByRole('navigation', { name: 'Table of contents' })

      await expect(navigation).toHaveCount(1)
      await expect(navigation.locator('a[href^="#"]')).toHaveCount(13)
      expect(await navigation.locator('a[href^="#"]').evaluateAll(links => links.every(link => {
        const fragment = link.getAttribute('href')?.slice(1)

        return fragment && document.getElementById(fragment)
      }))).toBe(true)
      await openTechnicalChapter(page)
      const destination = navigation.getByRole('link', { name: 'Technical highlights', exact: true })

      await destination.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#technical-highlights$/u)
      await expect(page.locator('#technical-highlights')).toBeInViewport()
      await expect(destination).toHaveAttribute('aria-current', 'location')
      await expect(navigation.locator('[aria-current="location"]')).toHaveCount(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await closeOpener(page)
    })
  }
}

test('project navigation switches between the opener and sidebar without duplicate accessible links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(route)
  await page.locator('[data-toc-summary]').click()
  await expectNoUnexpectedAccessibilityViolations(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('[data-project-mobile-toc]')).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Table of contents' })).toHaveCount(1)
  await expect(page.locator('[data-project-desktop-toc]')).toBeVisible()
  await expectNoUnexpectedAccessibilityViolations(page)
  await page.setViewportSize({ width: 390, height: 900 })
  await expect(page.locator('[data-project-desktop-toc]')).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Table of contents' })).toHaveCount(1)
})

test('project chapter opener and fragment links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(route)
  const summary = page.locator('[data-toc-summary]')

  await summary.focus()
  await page.keyboard.press('Enter')
  const navigation = page.getByRole('navigation', { name: 'Table of contents' })

  await expect(navigation.getByRole('link')).toHaveCount(13)
  await navigation.getByRole('link', { name: 'Why this experience matters', exact: true }).click()
  await expect(page).toHaveURL(/#why-this-experience-matters$/u)
  await expect(page.locator('#why-this-experience-matters')).toBeInViewport()
  await context.close()
})
