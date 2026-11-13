import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('Search presents one evidence list and restores every catalog row on clear', async ({ page }) => {
  await page.goto('/technologies/')
  const input = page.getByRole('searchbox', { name: 'Find a technology' })
  const groups = page.locator('[data-technology-group]')
  const originalOrder = await groups.evaluateAll(elements => elements.map(group => [...group.querySelectorAll<HTMLElement>('[data-technology-item]')].map(item => item.dataset.label)))
  const total = await page.locator('[data-technology-item]').count()
  const results = page.getByRole('region', { name: 'Matches for “React”' })

  await input.fill('React')
  await expect(results.getByRole('list')).toHaveAccessibleName('Matching technologies')
  await expect(results.getByRole('listitem')).toHaveCount(6)
  await expect(results.getByRole('link')).toHaveText([
    'React.js Core 12 entries',
    'React Native Core 5 entries',
    'React Hook Form Core 4 entries',
    'React Router Regular 2 entries',
    'Lucide React Selective 1 entry',
    'React Navigation Selective 1 entry'
  ])
  await expect(page.locator('[data-technology-groups]')).toBeHidden()
  await expect(page.locator('[data-technology-item]')).toHaveCount(total)
  await expect(input).toBeFocused()

  await input.fill('  typescript  ')
  await expect(page.locator('[data-technology-matches-list] a')).toHaveAccessibleName('TypeScript Core 20 entries')
  await expect(page.locator('[data-technology-item]')).toHaveCount(total)
  await input.fill('not-a-technology')
  await expect(page.locator('[data-technology-matches]')).toBeHidden()
  await expect(page.locator('[data-technologies-empty]')).toBeVisible()
  await expect(page.locator('[data-technology-item]')).toHaveCount(total)

  await input.fill('')
  await expect(page.locator('[data-technology-matches]')).toBeHidden()
  await expect(page.locator('[data-technology-groups]')).toBeVisible()
  await expect(page.locator('[data-technology-item]:visible')).toHaveCount(total)
  expect(await groups.evaluateAll(elements => elements.map(group => [...group.querySelectorAll<HTMLElement>('[data-technology-item]')].map(item => item.dataset.label)))).toEqual(originalOrder)
  await expect(groups.getByRole('link').first()).toHaveAccessibleName('React.js 12 entries')
})

for (const theme of ['light', 'dark'] as const) {
  test(`Match ledger remains readable and keyboard accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/technologies/')
    const input = page.getByRole('searchbox', { name: 'Find a technology' })
    const results = page.locator('[data-technology-matches]')

    await input.fill('React')
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const overflow = await results.evaluate(element => [...element.querySelectorAll('h2,p,a')].filter(copy => {
          const bounds = copy.getBoundingClientRect()
          const range = document.createRange()

          range.selectNodeContents(copy)
          return [...range.getClientRects()].some(rect => rect.width > 0 && (
            rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
          ))
        }).map(copy => copy.textContent))

        expect(overflow, `${width}px at ${size}% text`).toEqual([])
      }
    }
    await input.focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-technology-opening-actions]').getByRole('link', { name: 'Browse work' })).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const firstResult = results.getByRole('link').first()

    await expect(firstResult).toBeFocused()
    await expect(firstResult).toHaveCSS('outline-style', 'solid')
    const audit = await new AxeBuilder({ page }).include('[data-technology-catalog]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/technologies\/react-js\/$/u)
  })
}

test('Search heading treats the query as text and retains empty-state recovery', async ({ page }) => {
  await page.goto('/technologies/')
  const input = page.getByRole('searchbox', { name: 'Find a technology' })
  const query = '<img src=x onerror="alert(1)">'

  await input.fill(query)
  await expect(page.locator('[data-technology-match-query]')).toHaveText(query)
  await expect(page.locator('[data-technology-match-query] img')).toHaveCount(0)
  await expect(page.locator('#technology-filter-status')).toHaveText('0 technologies found.')
  await input.fill('CI/CD')
  await expect(page.locator('[data-technology-matches-list] a')).toHaveAttribute('href', '/technologies/ci-cd/')
  await expect(page.locator('[data-technologies-empty]')).toBeHidden()
})

test('Match arrows are created once per matched row instead of shipping with every catalog row', async ({ page }) => {
  await page.goto('/technologies/')

  const catalogArrows = page.locator('[data-technology-groups] [data-arrow-exchange]')
  const input = page.locator('#technology-filter')

  await expect(catalogArrows).toHaveCount(0)

  await input.fill('react')

  const rows = page.locator('[data-technology-matches-list] [data-technology-item]')

  await expect(rows.first()).toBeVisible()

  const matched = await rows.count()

  await expect(page.locator('[data-technology-matches-list] [data-arrow-exchange]')).toHaveCount(matched)

  // Clearing and repeating the search reuses each row's arrow.
  await input.fill('')
  await input.fill('react')
  await expect(page.locator('[data-technology-matches-list] [data-arrow-exchange]')).toHaveCount(matched)
  await expect(rows.first().locator('[data-arrow-exchange]')).toBeVisible()
})
