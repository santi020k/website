import { expect, test } from '@playwright/test'

import { expectClipboardContains } from './helpers/clipboard'

test.describe('Lumen integration', () => {
  test('enhances repeated content with the shared reveal runtime', async ({ page }) => {
    await page.goto('/blog/')

    const revealGroups = page.locator('[data-ui-reveal-group]')

    await expect(revealGroups.first()).toBeVisible()
    await expect(revealGroups.first()).toHaveAttribute('data-ui-reveal-once', 'true')
  })

  // Article links are copied by the site's closing share action; Lumen's copy runtime
  // still owns code examples, so verify its event contract with the real clipboard.
  test('copies a code example with accessible feedback', async ({ page, context, browserName }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    } catch {
      /* permissions API not supported on this browser engine */
    }

    await page.goto('/blog/avoid-magic-strings-in-typescript-and-javascript/')

    const figure = page.locator('.prose-santi [data-ui-code]').first()
    const copyButton = figure.locator('[data-ui-code-copy]')

    await expect(copyButton).toHaveAccessibleName('Copy code to clipboard')
    await page.clock.install()
    const copyResult = figure.evaluate(root => new Promise<{
      ariaLabel: string | null
      copiedLabelVisible: boolean
      state: string | undefined
    }>((resolve, reject) => {
      const button = root.querySelector<HTMLButtonElement>('[data-ui-code-copy]')

      if (!button) {
        reject(new Error('Copy button not found'))

        return
      }

      button.addEventListener('ui:copy-success', () => {
        const copiedLabel = button.querySelector<HTMLElement>('[data-slot="copy-copied"]')

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
      ariaLabel: 'Code copied to clipboard',
      copiedLabelVisible: true,
      state: 'copied'
    })
    await expect(copyButton.getByText('Copied', { exact: true })).toBeVisible()
    await expectClipboardContains(page, browserName, await figure.locator('pre code').innerText())
  })
})
