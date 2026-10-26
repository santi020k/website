import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`Catalog first reflows with an accessible search and shortcuts in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/technologies/')
    const opening = page.locator('[data-technology-opening]')
    const input = opening.getByRole('searchbox', { name: 'Find a technology' })
    const navigation = opening.getByRole('navigation', { name: 'Browse technology groups' })

    await expect(opening.getByRole('heading', { level: 1 })).toHaveText('Tools, connected to real work.')
    await expect(navigation.getByRole('link')).toHaveCount(3)
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const overflow = await opening.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h1,p,a,label,input')].filter(copy => {
            const rect = copy.getBoundingClientRect()

            return rect.left < bounds.left - 1 || rect.right > bounds.right + 1
          }).map(copy => copy.textContent)
        })

        expect(overflow, `Opening at ${width}px and ${size}% text`).toEqual([])
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '100%'
      })
      await expect(input).toBeInViewport()
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '100%'
    })
    await input.focus()
    await expect(input).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Tab')
    await expect(navigation.getByRole('link').first()).toBeFocused()
    await expect(navigation.getByRole('link').first()).toHaveCSS('outline-style', 'solid')
    const audit = await new AxeBuilder({ page }).include('[data-technology-opening]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#technology-group-0$/u)
    await expect(page.locator('#technology-group-0')).toBeFocused()
    await expect(page.locator('#technology-group-0')).toBeInViewport()
  })
}

test('Catalog shortcuts use rendered group counts and hide while filtering', async ({ page }) => {
  await page.goto('/technologies/')
  const groups = page.locator('[data-technology-group]')
  const navigation = page.getByRole('navigation', { name: 'Browse technology groups' })
  const input = page.getByRole('searchbox', { name: 'Find a technology' })

  for (let index = 0; index < await groups.count(); index += 1) {
    const count = await groups.nth(index).locator('[data-technology-item]').count()

    await expect(navigation.getByRole('link').nth(index)).toContainText(`${count} technologies`)
    await expect(navigation.getByRole('link').nth(index)).toHaveAttribute('href', `#technology-group-${index}`)
  }
  await input.fill('  typescript  ')
  await expect(navigation).toBeHidden()
  await expect(page.locator('[data-technology-result-count]')).toHaveText('1')
  await expect(page.locator('[data-technology-item]:visible')).toHaveCount(1)
  await expect(page.locator('[data-technology-item]:visible a')).toHaveAttribute('href', '/technologies/typescript/')
  await input.fill('no-such-technology')
  await expect(navigation).toBeHidden()
  await expect(page.getByRole('heading', { name: 'No technologies match that search.' })).toBeVisible()
  await input.fill('')
  await expect(navigation).toBeVisible()
  await expect(page.locator('[data-technology-group]:visible')).toHaveCount(3)
})

test('Catalog shortcuts and quiet destinations work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/technologies/')
    const navigation = page.getByRole('navigation', { name: 'Browse technology groups' })

    await navigation.getByRole('link', { name: /^Selective/u }).click()
    await expect(page).toHaveURL(/#technology-group-2$/u)
    await expect(page.locator('#technology-group-2')).toBeInViewport()
    await page.locator('[data-technology-opening-actions]').getByRole('link', { name: 'Portfolio', exact: true }).click()
    await expect(page).toHaveURL(/\/portfolio\/$/u)
  } finally {
    await context.close()
  }
})
