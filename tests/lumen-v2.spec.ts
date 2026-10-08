import { expect, test } from '@playwright/test'

import { expectArticleClipboard } from './helpers/clipboard'

test.describe('Lumen integration', () => {
  test('enhances repeated content with the shared reveal runtime', async ({ page }) => {
    await page.goto('/blog/')

    const revealGroups = page.locator('[data-ui-reveal-group]')

    await expect(revealGroups.first()).toBeVisible()
    await expect(revealGroups.first()).toHaveAttribute('data-ui-reveal-once', 'true')
  })

  test('copies an article URL with accessible feedback', async ({ page, context, browserName }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    } catch {
      /* permissions API not supported on this browser engine */
    }

    await page.goto('/blog/avoid-magic-strings-in-typescript-and-javascript/')

    const copyButton = page.getByRole('button', { name: 'Copy article link' })
    const copyResult = page.evaluate(() => new Promise<{
      ariaLabel: string | null
      copiedLabelVisible: boolean
      state: string | undefined
    }>((resolve, reject) => {
      const button = document.querySelector<HTMLButtonElement>('[data-ui-copy-button]')

      if (!button) {
        reject(new Error('Copy button not found'))

        return
      }

      button.addEventListener('ui:copy-success', () => {
        const copiedLabel = button.querySelector<HTMLElement>('[data-copied-label]')

        resolve({
          ariaLabel: button.getAttribute('aria-label'),
          copiedLabelVisible: copiedLabel ? getComputedStyle(copiedLabel).display !== 'none' : false,
          state: button.dataset.state
        })
      }, { once: true })

      setTimeout(() => {
        reject(new Error('Copy success event not emitted'))
      }, 5000)
    }))

    await copyButton.click()

    await expect(copyResult).resolves.toEqual({
      ariaLabel: 'Article link copied',
      copiedLabelVisible: true,
      state: 'copied'
    })
    await expectArticleClipboard(page, browserName, '/blog/avoid-magic-strings-in-typescript-and-javascript/')
  })
})
