import { expect, type Page, test } from '@playwright/test'

const ARTICLE_PATH = '/blog/avoid-magic-strings-in-typescript-and-javascript/'
const COPY_LABEL = 'Copy code to clipboard'

// Replace the clipboard so success and denial are deterministic in every engine.
const stubClipboard = async (page: Page, outcome: 'reject' | 'resolve'): Promise<void> => {
  await page.addInitScript(result => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          if (result === 'reject') {
            return Promise.reject(new DOMException('denied for test', 'NotAllowedError'))
          }

          window.localStorage.setItem('code-copy-test-value', text)

          return Promise.resolve()
        }
      }
    })
  }, outcome)
}

test.describe('Article code block copy button', () => {
  test('announces success, then restores its code-specific label and state', async ({ page }) => {
    await stubClipboard(page, 'resolve')
    await page.goto(ARTICLE_PATH)
    await page.clock.install()

    const figure = page.locator('.prose-santi [data-ui-code]').first()
    const button = figure.locator('[data-ui-code-copy]')

    await expect(button).toHaveAttribute('aria-label', COPY_LABEL)
    await expect(button).toHaveAttribute('title', COPY_LABEL)
    await expect(button).toHaveAttribute('data-state', 'idle')
    await expect(button.getByText('Copy', { exact: true })).toBeVisible()

    await button.click()

    await expect(button).toHaveAttribute('data-state', 'copied')
    await expect(button).toHaveAttribute('aria-label', 'Code copied to clipboard')
    await expect(button.getByText('Copied', { exact: true })).toBeVisible()
    await expect(button.getByText('Copy', { exact: true })).toBeHidden()

    const copied = await page.evaluate(() => window.localStorage.getItem('code-copy-test-value'))
    const code = await figure.locator('pre code').innerText()

    expect(copied).toBe(code)
    // Pretty Code inserts a space on empty lines; numbers must never enter the snippet.
    expect(copied?.split('\n').map(line => line.trim() ? line : '').join('\n')).toBe([
      'export const ORDER_STATUS = {',
      '  approved: \'approved\',',
      '  pendingReview: \'pending_review\',',
      '  rejected: \'rejected\'',
      '} as const',
      '',
      'export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]'
    ].join('\n'))

    await page.clock.fastForward(2000)
    await expect(button).toHaveAttribute('data-state', 'idle')
    await expect(button).toHaveAttribute('aria-label', COPY_LABEL)
    await expect(button).toHaveAttribute('title', COPY_LABEL)
    await expect(button.getByText('Copy', { exact: true })).toBeVisible()
  })

  test('explains manual recovery on failure, then restores its code-specific label', async ({ page }) => {
    await stubClipboard(page, 'reject')
    await page.setViewportSize({ height: 900, width: 320 })
    await page.goto(ARTICLE_PATH)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await page.clock.install()

    const button = page.locator('.prose-santi [data-ui-code-copy]').first()
    const errorLabel = 'Could not copy code. Select and copy it manually.'

    await button.click()

    await expect(button).toHaveAttribute('data-state', 'error')
    await expect(button).toHaveAttribute('aria-label', errorLabel)
    await expect(button).toHaveAttribute('title', errorLabel)
    await expect(button.getByText('Copy failed', { exact: true })).toBeVisible()

    const cardEdge = await page.locator('.prose-santi [data-ui-code]').first()
      .evaluate(element => element.getBoundingClientRect().right)
    const buttonEdge = await button.evaluate(element => element.getBoundingClientRect().right)

    expect(buttonEdge).toBeLessThanOrEqual(cardEdge)

    await page.clock.fastForward(2000)
    await expect(button).toHaveAttribute('data-state', 'idle')
    await expect(button).toHaveAttribute('aria-label', COPY_LABEL)
    await expect(button).toHaveAttribute('title', COPY_LABEL)
  })
})
