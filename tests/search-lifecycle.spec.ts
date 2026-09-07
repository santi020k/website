import { expect, test } from '@playwright/test'

test('repeated search close requests cannot close a newly reopened dialog', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install()
  await page.goto('/')

  const trigger = page.locator('[data-site-search-trigger]')
  const dialog = page.locator('#site-search-dialog')

  await trigger.click()
  await expect(dialog).toBeVisible()

  const reopened = await page.evaluate(() => {
    const close = document.querySelector('[data-site-search-close]')
    const panel = document.querySelector('[data-site-search-panel]')
    const triggerButton = document.querySelector('[data-site-search-trigger]')
    const searchDialog = document.getElementById('site-search-dialog')

    if (!(close instanceof HTMLButtonElement) || !(panel instanceof HTMLElement) ||
      !(triggerButton instanceof HTMLButtonElement) || !(searchDialog instanceof HTMLDialogElement)) {
      throw new Error('Missing search controls')
    }

    close.click()
    close.click()
    panel.dispatchEvent(new AnimationEvent('animationend', { animationName: 'site-search-panel-out' }))
    triggerButton.click()

    return searchDialog.open
  })

  expect(reopened).toBe(true)
  await page.clock.runFor(600)

  await expect(dialog).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#site-search-input')).toBeFocused()
})
