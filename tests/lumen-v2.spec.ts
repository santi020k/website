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

    const copyButton = page.locator('.editorial-detail-hero [data-ui-copy-button]')

    await expect(copyButton).toHaveAccessibleName('Copy link to article')
    await page.clock.install()
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
          copiedLabelVisible: copiedLabel?.checkVisibility() ?? false,
          state: button.dataset.state
        })
      }, { once: true })

      setTimeout(() => {
        reject(new Error('Copy success event not emitted'))
      }, 5000)
    }))

    await copyButton.click()

    await expect(copyResult).resolves.toEqual({
      ariaLabel: 'Copied! Article link copied',
      copiedLabelVisible: true,
      state: 'copied'
    })
    await expect(copyButton.locator('[data-copied-label]')).toBeVisible()
    await expect(copyButton).toHaveText('Copied!', { useInnerText: true })
    await expectArticleClipboard(page, browserName, '/blog/avoid-magic-strings-in-typescript-and-javascript/')
  })
})
