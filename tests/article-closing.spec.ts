import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const article = '/blog/responsive-design-standards-that-scale-across-components/'
const nextKeys = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
}

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`reader colophon preserves its destinations at ${width}px, ${textSize}% text, ${theme}`, async ({ page, browserName }) => {
        const nextKey = nextKeys[browserName]

        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme })
        await page.route('https://giscus.app/**', route => route.abort())
        await page.goto(article)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const closing = page.locator('[data-article-closing]')
        const reply = closing.getByRole('link', { name: 'Browse GitHub discussions' })
        const copy = closing.getByRole('button', { name: 'Copy link', exact: true })
        const finalReturn = page.locator('[data-post-final-return]')
        const navigation = page.getByRole('navigation', { name: 'Page-end navigation', exact: true })

        await expect(navigation).toHaveCount(1)
        await expect(finalReturn.getByRole('link', { name: 'Back to Blog' })).toHaveCount(1)

        await closing.scrollIntoViewIfNeeded()
        await closing.locator('[data-discussion-summary]').press('Enter')
        await expect(closing.getByRole('heading', { name: 'Comments', exact: true })).toBeVisible()
        await expect(closing.getByRole('heading', { name: 'Share', exact: true })).toBeVisible()
        await expect(reply).toHaveAttribute('href', 'https://github.com/santi020k/website/discussions')
        await expect(closing.locator('[data-giscus-mount]')).toBeHidden()
        await expect(closing.locator('[data-giscus-error]')).toContainText('You can still browse discussions on GitHub')
        await expect(navigation.getByRole('link', { name: 'Back to Blog' })).toHaveAttribute('href', '/blog/')
        await expect(navigation.getByRole('link', { name: 'Back to top' })).toHaveAttribute('href', '#main')
        for (const platform of ['LinkedIn', 'X', 'WhatsApp']) {
          const link = closing.getByRole('link', { name: `Share on ${platform}`, exact: true })

          await expect(link).toHaveAttribute('target', '_blank')
          await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        }
        expect(await closing.evaluate(element => {
          const comments = element.querySelector('#comments')?.getBoundingClientRect()
          const sharing = element.querySelector('[data-share-card]')?.getBoundingClientRect()
          const invitation = element.querySelector('[data-discussion-invitation]')?.getBoundingClientRect()
          const finalReturn = document.querySelector('[data-post-final-return]')
          const navigation = finalReturn?.getBoundingClientRect()
          const related = document.querySelector('#related-writing')?.closest('[data-page-section]')?.getBoundingClientRect()

          if (!comments || !sharing || !invitation || !navigation || !finalReturn) {
            throw new Error('Expected all closing sections')
          }
          const subpixel = 0.02

          return sharing.bottom <= comments.top + subpixel && invitation.top - sharing.bottom >= 24 - subpixel &&
            comments.bottom <= navigation.top + subpixel &&
            (!related || (comments.bottom <= related.top + subpixel && related.bottom <= navigation.top + subpixel)) &&
            document.documentElement.scrollWidth <= innerWidth &&
            [...element.querySelectorAll('a, button, summary'), ...finalReturn.querySelectorAll('a')].every(control => {
              const bounds = control.getBoundingClientRect()

              return bounds.left >= 0 && bounds.right <= innerWidth && bounds.height >= 44 &&
                control.scrollWidth <= control.clientWidth + 1
            })
        })).toBe(true)
        await copy.focus()
        await expect(copy).toBeFocused()
        await expect(copy).toHaveCSS('outline-style', 'solid')
        for (const platform of ['LinkedIn', 'X', 'WhatsApp']) {
          await page.keyboard.press(nextKey)
          await expect(closing.getByRole('link', { name: `Share on ${platform}`, exact: true })).toBeFocused()
        }
        await page.keyboard.press(nextKey)
        await expect(closing.locator('[data-discussion-summary]')).toBeFocused()
        await page.keyboard.press(nextKey)
        await expect(reply).toBeFocused()
        await expect(reply).toHaveCSS('outline-style', 'solid')
        await navigation.getByRole('link', { name: 'Back to Blog' }).focus()
        await expect(navigation.getByRole('link', { name: 'Back to Blog' })).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press(nextKey)
        await expect(navigation.getByRole('link', { name: 'Back to top' })).toBeFocused()
        const scan = await new AxeBuilder({ page }).include('[data-article-closing]').include('[data-post-final-return]').analyze()

        expect(scan.violations).toEqual([])
        await navigation.getByRole('link', { name: 'Back to Blog' }).click()
        await expect(page).toHaveURL('/blog/')
      })
    }
  }
}

test('the colophon keeps native destinations and no empty widget space without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(article)
  const closing = page.locator('[data-article-closing]')

  await expect(closing.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(0)
  await expect(closing.getByRole('link')).toHaveCount(4)
  expect(await closing.locator('[data-giscus-mount]').evaluate(element => element.getBoundingClientRect().height)).toBe(0)
  const summary = closing.locator('[data-discussion-summary]')

  await summary.press('Enter')
  await expect(closing.locator('[data-discussion-noscript]')).toBeVisible()
  await expect(closing.getByRole('link', { name: 'Browse GitHub discussions' })).toBeVisible()
  await summary.press('Enter')
  await expect(closing.locator('[data-discussion-noscript]')).toBeHidden()
  await page.getByRole('navigation', { name: 'Page-end navigation' }).getByRole('link', { name: 'Back to top' }).click()
  await expect(page).toHaveURL(/#main$/u)
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  await context.close()
})

for (const example of [
  { route: '/blog/run-repo-on-mac-with-silo-dxmt/', hasRecommendations: true },
  { route: '/blog/write-better-review-feedback-with-conventional-comments/', hasRecommendations: false }
]) {
  test(`Final return closes the page with${example.hasRecommendations ? '' : 'out'} recommendations`, async ({ page }) => {
    await page.goto(example.route)
    await expect(page.locator('#related-writing')).toHaveCount(example.hasRecommendations ? 1 : 0)
    const finalReturn = page.locator('[data-post-final-return]')

    expect(await finalReturn.evaluate((element, hasRecommendations) => {
      const newsletter = document.querySelector('[data-article-newsletter]')
      if (newsletter && element.previousElementSibling !== newsletter) return false

      const previous = (newsletter ?? element).previousElementSibling
      return hasRecommendations ? Boolean(previous?.querySelector('#related-writing')) : previous?.matches('article')
    }, example.hasRecommendations)).toBe(true)
    await expect(page.getByRole('navigation', { name: 'Page-end navigation' })).toHaveCount(1)
    await finalReturn.getByRole('link', { name: 'Back to top' }).press('Enter')
    await expect(page).toHaveURL(/#main$/u)
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  })
}

test('project closing sections retain Dispatch sleeve and Return folio', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')
  const closing = page.locator('[data-project-closing]')

  await expect(closing.getByRole('heading', { name: 'Share this piece' })).toBeVisible()
  await expect(closing.locator('[data-share-card]')).toHaveCSS('border-top-width', '1px')
  await expect(closing.locator('[data-return-folio]')).toHaveCSS('border-top-width', '1px')
  await expect(page.locator('[data-article-closing]')).toHaveCount(0)
})
