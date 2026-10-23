import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test(`Resume experience preserves readable roles and impact in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/resume/')
    const entries = page.locator('[data-resume-entry], [data-resume-compact-entry], [data-resume-community-entry]')

    await expect(entries).toHaveCount(9)
    for (const entry of await entries.all()) {
      await expect(entry.getByRole('heading', { level: 3 })).not.toBeEmpty()
      await expect(entry.locator('[data-resume-date]')).not.toBeEmpty()
      await expect(entry.locator(':scope > p')).not.toBeEmpty()
    }
    for (const entry of await page.locator('[data-resume-entry], [data-resume-community-entry]').all()) {
      await expect(entry.locator('[data-resume-stack] > span').first()).toBeVisible()
      await expect(entry.getByRole('list')).toHaveCount(1)
      await expect(entry.getByRole('listitem').first()).toBeVisible()
    }
    await expectNoUnexpectedAccessibilityViolations(page)
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const overflow = await entries.evaluateAll(rows => rows.flatMap(row => {
          const bounds = row.getBoundingClientRect()

          return [...row.querySelectorAll('h3, [data-resume-date], p, h4, li, [data-resume-stack] > span')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, bounds.left) - 1 ||
              rect.right > Math.min(innerWidth, bounds.right) + 1 ||
              rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        }))

        expect(overflow, `Experience at ${width}px and ${size}% must fit`).toEqual([])
        const overlap = await entries.evaluateAll(rows => rows.some(row => {
          const date = row.querySelector('[data-resume-date]')?.getBoundingClientRect()
          const heading = row.querySelector('h3')?.getBoundingClientRect()

          return date && heading && date.right > heading.left + 1 && date.bottom > heading.top + 1
        }))

        expect(overlap, 'Dates must not overlap their role headings').toBe(false)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('Resume print keeps inline roles and a compact impact list', async ({ page }) => {
  await page.goto('/resume/')
  await page.emulateMedia({ media: 'print' })
  const entries = page.locator('[data-resume-entry]')

  for (const entry of await entries.all()) {
    await expect(entry.locator('[data-resume-role-separator]')).toBeVisible()
    await expect(entry.locator('[data-resume-stack]')).toBeHidden()
    await expect(entry.getByRole('list')).toHaveCSS('list-style-type', 'disc')
    await expect(entry).toHaveCSS('break-inside', 'avoid')
  }
  await expect(entries.nth(2)).toHaveCSS('break-before', 'page')
  const community = page.locator('[data-resume-community-entry]')

  await expect(community).toHaveCount(1)
  await expect(community).toBeVisible()
  await expect(community.locator('[data-resume-community-header]')).toHaveCSS('display', 'flex')
  await expect(community.locator('[data-resume-role-separator]')).toBeVisible()
  await expect(community.locator('[data-resume-stack]')).toBeHidden()
  await expect(community.getByRole('list')).toHaveCSS('list-style-type', 'disc')
  await expect(community).toHaveCSS('break-inside', 'avoid')
  const compact = page.locator('[data-resume-compact-entry]')

  await expect(compact).toHaveCount(4)
  for (const entry of await compact.all()) await expect(entry).toBeHidden()
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-resume-variant', 'full')
  })
  await expect(community).toBeVisible()
  for (const entry of await compact.all()) {
    await expect(entry).toBeVisible()
    await expect(entry.locator('[data-resume-role-separator]')).toBeVisible()
    await expect(entry).toHaveCSS('break-inside', 'avoid')
  }
})
