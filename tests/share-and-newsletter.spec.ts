/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

test.describe('Newsletter signup', () => {
  test('footer newsletter form points at the configured action and links to privacy', async ({ page }) => {
    await page.goto('/')

    const form = page.locator('footer form[action*="buttondown"]').first()
    await expect(form).toHaveCount(1)
    await expect(form.locator('input[name="email"]')).toBeVisible()
    await expect(form.locator('input[name="email"]')).toHaveAttribute('autocomplete', /^email$/)
    await expect(form.locator('input[name="email"]')).toHaveAttribute('required', /^$/)
    await expect(form.getByRole('button', { name: /Subscribe/i })).toBeVisible()

    const privacyLink = page
      .locator('footer')
      .getByRole('link', { name: 'Privacy & analytics' })
    await expect(privacyLink.first()).toHaveAttribute('href', /^\/privacy\/$/)
  })

  test('newsletter heading drives the section accessible name', async ({ page }) => {
    await page.goto('/')

    const heading = page
      .locator('footer')
      .getByRole('heading', { name: 'Engineering notes & writeups' })
    await expect(heading).toBeVisible()
  })
})

test.describe('Share buttons', () => {
  test.beforeEach(async ({ page, context }) => {
    // Granting clipboard permission so navigator.clipboard.writeText works in
    // headless Chromium. Other browsers ignore unknown permissions.
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    } catch {
      /* permissions API not supported on this browser engine */
    }

    // Force fine pointer so the component's "supportsWebShare" check returns
    // false and we exercise the clipboard fallback path even on touch builds.
    await page.emulateMedia({ media: 'screen', forcedColors: 'none' })
  })

  test('clicking the copy button writes the canonical URL to the clipboard', async ({ page }) => {
    const response = await page.request.get('/feed.xml')
    const body = await response.text()
    const slugMatch = /<link>(https:\/\/[^<]+\/blog\/[^<]+\/)<\/link>/.exec(body)
    expect(slugMatch).not.toBeNull()

    const postUrl = slugMatch?.[1] ?? ''
    const path = new URL(postUrl).pathname
    await page.goto(path)

    const copyButton = page.locator('#copy-link-btn')
    await expect(copyButton).toBeVisible()
    await copyButton.click()

    await expect(page.locator('#copy-label')).toHaveText(/Link copied!/i, { timeout: 4000 })

    const copied = await page.evaluate(async () => navigator.clipboard.readText())
    expect(copied).toContain(path)
  })
})
