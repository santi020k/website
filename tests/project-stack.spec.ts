import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('project hero shows the core stack and reveals every remaining technology', async ({ page }) => {
  await page.goto('/portfolio/smith-commerce/')

  const stack = page.locator('[data-project-stack]')
  await expect(stack).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Core stack', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-project-sidebar] [data-project-focus] + [data-project-outcomes]')).toHaveCount(1)
  const disclosure = stack.locator('details')
  const trigger = stack.locator('summary')
  const extraTechnology = stack.getByRole('link', { name: 'Contentstack', exact: true })
  const coreTechnologies = ['Next.js', 'React.js', 'TypeScript', 'Turborepo', 'Tailwind CSS', 'Radix UI']

  await expect(stack.getByRole('link')).toHaveText(coreTechnologies)
  await expect(trigger).toHaveText('More technologies (29)')
  await expect(extraTechnology).toBeHidden()
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(stack.getByRole('link')).toHaveCount(35)
  await expect(extraTechnology).toHaveAttribute('href', '/technologies/contentstack/')
  await expectNoUnexpectedAccessibilityViolations(page)
  await trigger.click()
  await expect(disclosure).not.toHaveAttribute('open', '')
  await expect(stack.getByRole('link')).toHaveText(coreTechnologies)
})

test('project hero is the only stack and reveals technologies with keyboard and pointer', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')

  const stack = page.locator('[data-project-stack]')
  await expect(stack).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Core stack', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-project-sidebar] [data-project-focus] + [data-project-outcomes]')).toHaveCount(1)
  const disclosure = stack.locator('details')
  const trigger = stack.locator('summary')
  const extraTechnology = stack.getByRole('listitem').filter({ hasText: /^Accessibility$/ })

  await expect(stack.locator('[data-project-stack-preview] li')).toHaveText(['Astro', 'React.js', 'Web Components', 'TypeScript', 'CSS', 'Tailwind CSS'])
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

test('hero stack retains legacy fragments and its disclosure without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('/portfolio/lumen-ui/#sidebar-stack')

  const hero = page.locator('[data-project-stack]')
  await expect(hero.getByRole('heading', { name: 'Stack', exact: true })).toBeInViewport()
  const heroTrigger = hero.locator('summary')
  await expect(hero.getByRole('link')).toHaveCount(6)
  await heroTrigger.scrollIntoViewIfNeeded()
  await expect(heroTrigger).toBeInViewport({ ratio: 1 })
  await heroTrigger.click()
  await expect(hero.getByRole('link', { name: 'Accessibility', exact: true })).toBeVisible()
  await expect(hero.getByRole('link')).toHaveCount(18)

  await expect(hero.getByRole('link', { name: 'AI-assisted Development', exact: true })).toBeVisible()
  await expect(page.locator('[data-project-sidebar] [data-project-stack]')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await context.close()
})
