import { expect, type Locator, type Page } from '@playwright/test'

/** English sharing controls must expose the exact action offered by the current platform. */
export const expectIdleShareAction = async (page: Page, button: Locator) => {
  const nativeShare = await page.evaluate(() => (
    typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
  ))

  const label = nativeShare ? 'Share link' : 'Copy link'

  await expect(button).toHaveAccessibleName(label)

  await expect(button.locator('[data-copy-label]')).toBeVisible()

  await expect(button.locator('[data-copy-label]')).toHaveText(label)

  await expect(button.locator(nativeShare ? '[data-share-icon]' : '[data-copy-icon]')).toBeVisible()

  await expect(button.locator(nativeShare ? '[data-copy-icon]' : '[data-share-icon]')).toBeHidden()
}
