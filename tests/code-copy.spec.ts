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

    await button.click()

    await expect(button).toHaveAttribute('data-state', 'copied')
    await expect(button).toHaveAttribute('aria-label', 'Code copied to clipboard')

    const copied = await page.evaluate(() => window.localStorage.getItem('code-copy-test-value'))
    const code = await figure.locator('pre code').innerText()

    expect(copied).toBe(code)

    await page.clock.fastForward(2000)
    await expect(button).toHaveAttribute('data-state', 'idle')
    await expect(button).toHaveAttribute('aria-label', COPY_LABEL)
    await expect(button).toHaveAttribute('title', COPY_LABEL)
  })

  test('explains manual recovery on failure, then restores its code-specific label', async ({ page }) => {
    await stubClipboard(page, 'reject')
    await page.goto(ARTICLE_PATH)
    await page.clock.install()

    const button = page.locator('.prose-santi [data-ui-code-copy]').first()
    const errorLabel = 'Could not copy code. Select and copy it manually.'

    await button.click()

    await expect(button).toHaveAttribute('data-state', 'error')
    await expect(button).toHaveAttribute('aria-label', errorLabel)
    await expect(button).toHaveAttribute('title', errorLabel)

    await page.clock.fastForward(2000)
    await expect(button).toHaveAttribute('data-state', 'idle')
    await expect(button).toHaveAttribute('aria-label', COPY_LABEL)
    await expect(button).toHaveAttribute('title', COPY_LABEL)
  })
})
