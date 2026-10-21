import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('project stack reveals additional technologies with keyboard and pointer', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')

  const stack = page.locator('section[aria-labelledby="sidebar-stack"]')
  const disclosure = stack.locator('details')
  const trigger = stack.locator('summary')
  const extraTechnology = stack.getByRole('listitem').filter({ hasText: /^Accessibility$/ })

  await expect(stack.locator('[data-stack-preview] li')).toHaveText(['Astro', 'React.js', 'Web Components', 'TypeScript', 'CSS', 'Tailwind CSS'])
  await expect(stack.locator('li:visible')).toHaveCount(6)
  await expect(trigger).toHaveText('More technologies (12)')
  await expect(extraTechnology).toBeHidden()
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(extraTechnology).toBeVisible()
  await expect(stack.getByRole('listitem').filter({ hasText: /^Open Source$/ })).toBeVisible()
  await expect(stack.locator('li:visible')).toHaveCount(18)
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
  const trigger = stack.locator('summary')

  // The no-JavaScript page retains CSS smooth scrolling. Let the native scroll
  // reach the disclosure before Playwright attempts its pointer interaction.
  await trigger.scrollIntoViewIfNeeded()
  await expect(trigger).toBeInViewport({ ratio: 1 })
  await trigger.click()
  await expect(stack.getByRole('listitem').filter({ hasText: /^AI-assisted Development$/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await context.close()
})
