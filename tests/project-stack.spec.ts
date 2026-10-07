import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('project stack reveals additional technologies with keyboard and pointer', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')

  const stack = page.locator('section[aria-labelledby="sidebar-stack"]')
  const disclosure = stack.locator('details')
  const trigger = stack.locator('summary')
  const extraTechnology = stack.locator('.ui-pill').filter({ hasText: /^Accessibility$/ })

  await expect(stack.locator('.ui-pill').filter({ hasText: /^Astro$/ })).toBeVisible()
  await expect(trigger).toHaveText('More technologies (12)')
  await expect(extraTechnology).toBeHidden()
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(extraTechnology).toBeVisible()
  await expect(stack.locator('.ui-pill').filter({ hasText: /^Open Source$/ })).toBeVisible()
  await expectNoUnexpectedAccessibilityViolations(page)
  await trigger.click()
  await expect(disclosure).not.toHaveAttribute('open', '')
  await expect(extraTechnology).toBeHidden()
})

test('project stack disclosure fits a narrow viewport without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/portfolio/lumen-ui/')

  const stack = page.locator('section[aria-labelledby="sidebar-stack"]')
  await stack.locator('summary').click()
  await expect(stack.locator('.ui-pill').filter({ hasText: /^AI-assisted Development$/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await context.close()
})
