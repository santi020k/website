import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark']) {
  for (const { width, textSize } of [
    { width: 320, textSize: 200 },
    { width: 390, textSize: 100 },
    { width: 1024, textSize: 200 },
    { width: 1440, textSize: 100 }
  ]) {
    test(`project reading closes in sequence at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)

      for (const slug of ['smith-commerce', 'lumen-ui', 'react-js-colombia']) {
        await page.goto(`/portfolio/${slug}/`)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        await expect(page.getByRole('region', { name: 'Focus', exact: true })).toHaveCount(1)
        await expect(page.getByRole('region', { name: 'Share this piece', exact: true })).toHaveCount(1)
        await expect(page.getByRole('navigation', { name: 'Page-end navigation', exact: true })).toHaveCount(1)

        const layout = await page.locator('[data-project-reading]').evaluate(element => {
          const story = element.querySelector('[data-project-story]')
          const rail = element.querySelector('[data-project-sidebar]')
          const closing = element.querySelector('[data-project-closing]')
          const share = element.querySelector('[data-share-card]')
          const navigation = element.querySelector('[data-reading-actions]')

          if (!story || !rail || !closing || !share || !navigation) throw new Error('Missing reading group')
          const storyBounds = story.getBoundingClientRect()
          const railBounds = rail.getBoundingClientRect()
          const closingBounds = closing.getBoundingClientRect()
          const stacked = getComputedStyle(element).gridTemplateColumns.split(' ').length === 1

          return {
            sourceOrder: Boolean(story.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING) &&
              Boolean(rail.compareDocumentPosition(closing) & Node.DOCUMENT_POSITION_FOLLOWING),
            closingOrder: share.getBoundingClientRect().bottom <= navigation.getBoundingClientRect().top,
            stacked,
            layoutMatches: stacked ?
              storyBounds.bottom <= railBounds.top && railBounds.bottom <= closingBounds.top :
              railBounds.left > storyBounds.right && Math.abs(storyBounds.left - closingBounds.left) < 1 &&
              Math.abs(storyBounds.width - closingBounds.width) < 1 && storyBounds.bottom <= closingBounds.top,
            railPosition: getComputedStyle(rail).position
          }
        })

        expect(layout.sourceOrder).toBe(true)
        expect(layout.closingOrder).toBe(true)
        expect(layout.layoutMatches).toBe(true)
        expect(layout.railPosition).toBe(layout.stacked ? 'static' : 'sticky')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    })
  }

  test(`project closing actions remain accessible and copy the project permalink in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: (text: string) => {
          localStorage.setItem('closing-copied-link', text)
          return Promise.resolve()
        } }
      })
    }, theme)
    await page.goto('/portfolio/smith-commerce/#sidebar-focus')
    await expect(page.getByRole('heading', { name: 'Focus', exact: true })).toBeInViewport()
    const copy = page.locator('[data-project-closing]').getByRole('button', { name: 'Copy link', exact: true })

    await copy.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('closing-copied-link'))).toBe('https://santi020k.com/portfolio/smith-commerce/')
    await expect(page.locator('#copy-status')).toHaveText('Link copied!')
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('reading close retains Focus, sharing, and return links without JavaScript', async ({ browser, browserName }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  try {
    await page.goto('/portfolio/smith-commerce/#sidebar-focus')
    await expect(page.getByRole('heading', { name: 'Focus', exact: true })).toBeInViewport()
    const closing = page.locator('[data-project-closing]')

    await expect(closing.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(0)
    const lastShare = closing.getByRole('link', { name: 'Share on WhatsApp', exact: true })

    await lastShare.focus()
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    const back = closing.getByRole('link', { name: 'Back to Work', exact: true })

    await expect(back).toBeFocused()
    await expect(back).toHaveAttribute('href', '/work/')
    await expect(closing.getByRole('link', { name: 'Visit Marcone', exact: true })).toHaveAttribute('href', 'https://www.marcone.com/')
    await closing.getByRole('link', { name: 'Back to top', exact: true }).click()
    await expect(page).toHaveURL(/#main$/u)
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  } finally {
    await context.close()
  }
})
