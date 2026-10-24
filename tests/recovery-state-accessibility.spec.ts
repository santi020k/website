import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const article = '/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/'

const setTextSize = async (page: Page, textSize: number) => {
  await page.addInitScript(size => {
    const apply = () => {
      const root = document.querySelector('html')

      if (!root) return false
      root.style.fontSize = `${size}%`
      return true
    }

    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect()
      })

      observer.observe(document, { childList: true })
    }
    document.addEventListener('astro:before-swap', event => {
      event.newDocument.documentElement.style.fontSize = `${size}%`
    })
  }, textSize)
}

const expectCopyInside = async (target: Locator) => {
  const outside = await target.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const clipped: string[] = []
    let node = walker.nextNode()

    while (node) {
      if (node.textContent?.trim() && node.parentElement?.checkVisibility()) {
        const range = document.createRange()

        range.selectNodeContents(node)
        if ([...range.getClientRects()].some(rect => rect.width > 0 && (
          rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1
        ))) clipped.push(node.textContent.trim())
      }
      node = walker.nextNode()
    }
    return clipped
  })

  expect(outside).toEqual([])
}

for (const width of [320, 390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Recovery states ${width}px / ${textSize}% / ${theme}`, () => {
        test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test.beforeEach(async ({ page }) => {
          await setTextSize(page, textSize)
          await page.route('https://giscus.app/**', route => route.abort())
        })

        test('404 suggestions remain identifiable and keyboard usable', async ({ page, browserName }) => {
          await page.goto('/this-page-does-not-exist/')
          await page.evaluate(() => document.fonts.ready)
          const suggestions = page.locator('main .editorial-rail').getByRole('link')

          await expect(suggestions).toHaveCount(3)
          await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
          for (const link of await suggestions.all()) {
            const identifiable = await link.evaluate(element => {
              const arrow = element.querySelector('[data-recovery-direction]')
              const title = element.querySelector('h3')
              return arrow?.checkVisibility() === true || Boolean(title && getComputedStyle(title).textDecorationLine.includes('underline'))
            })
            expect(identifiable).toBe(true)
            await link.focus()
            await expect(link).toBeFocused()
            await expect(link).toBeInViewport()
            await expect(link).toHaveCSS('outline-style', 'solid')
            await expect(link.getByRole('heading', { level: 3 })).toHaveCSS('text-decoration-line', 'underline')
            await expectCopyInside(link.locator('..'))
          }
          await suggestions.last().press('Enter')
          await expect(page).toHaveURL('/about/')
          await expect(page.locator('html')).toHaveCSS('font-size', `${textSize * 0.16}px`)
        })

        test('failed copying stays readable, announces its state and restores focus', async ({ page }) => {
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
            Object.defineProperty(navigator, 'clipboard', {
              configurable: true,
              value: { writeText: () => Promise.reject(new DOMException('Synthetic denial', 'NotAllowedError')) }
            })
          })
          await page.goto(article)
          const button = page.locator('#copy-link-btn')
          const status = page.locator('#copy-status')

          await button.focus()
          await page.keyboard.press('Enter')
          await expect(button).toHaveText('Copy failed')
          await expect(button).toBeFocused()
          // The button's changing label is not itself a live announcement.
          await expect(button.locator('#copy-label')).not.toHaveAttribute('aria-live')
          await expect(status).toHaveRole('status')
          await expect(status).toHaveAttribute('aria-live', 'polite')
          await expect(status).toHaveAttribute('aria-atomic', 'true')
          await expect(status).toHaveText('Copy failed. Select and copy the address manually.')
          await expectCopyInside(button)
          const scan = await new AxeBuilder({ page }).include('#copy-link-btn').analyze()

          expect(scan.violations).toEqual([])
          expect(scan.incomplete.filter(result => result.id === 'color-contrast')).toEqual([])
          await expect(button).toHaveText('Copy link')
          await expect(status).toBeEmpty()
          await expect(button).toBeFocused()
          await expect(button).not.toHaveClass(/copy-failed/u)
        })

        test('blocked comments expose readable recovery guidance without an empty widget', async ({ page }) => {
          await page.goto(article)
          const comments = page.getByRole('region', { name: 'Comments', exact: true })

          await comments.scrollIntoViewIfNeeded()
          await expect(comments.getByRole('heading', { name: 'Comments', level: 2 })).toBeVisible()
          await expect(comments.getByText('Join the conversation.', { exact: true })).toBeVisible()
          await expect(comments.getByText('Powered by GitHub Discussions. Sign in with GitHub to share your thoughts.')).toBeVisible()
          await expect(comments.locator('[data-giscus-mount]')).toBeHidden()
          const error = comments.locator('[data-giscus-error]')

          await expect(error).toBeVisible()
          await expectCopyInside(comments)
          const link = comments.getByRole('link', { name: 'Reply on GitHub', exact: true })

          await link.focus()
          await expect(link).toBeFocused()
          await expect(link).toHaveCSS('outline-style', 'solid')
          await expectCopyInside(comments.locator('[data-discussion-invitation]'))
          const target = await link.boundingBox()

          expect(target?.height).toBeGreaterThanOrEqual(44)
          await expect(link).toHaveAttribute('target', '_blank')
          await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
          await expectNoUnexpectedAccessibilityViolations(page)
        })
      })
    }
  }
}

test.describe('Without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('comments retain their GitHub fallback without an empty reserved area', async ({ page }) => {
    await page.goto(article)
    const comments = page.getByRole('region', { name: 'Comments', exact: true })

    await expect(comments.getByRole('heading', { name: 'Comments', level: 2 })).toBeVisible()
    await expect(comments.getByRole('link', { name: 'Reply on GitHub', exact: true })).toHaveAttribute('href', /^https:\/\/github\.com\/santi020k\/website\/discussions$/u)
    await expect(comments.locator('[data-giscus-mount]')).toBeEmpty()
    await expect(comments.locator('[data-giscus-mount]')).toHaveCSS('min-height', '0px')
    await expect(comments.locator('[data-giscus-error]')).toBeHidden()
  })
})
