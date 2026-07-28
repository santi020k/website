/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

test.describe('Index filters', () => {
  test('filters blog topics and announces the result count', async ({ page }) => {
    await page.goto('/blog/tags/')

    await page.getByRole('searchbox', { name: 'Find a topic' }).fill('accessibility')

    await expect(page.locator('#tag-filter-status')).toHaveText('1 topic found.')
    await expect(page.locator('#tags-list > [data-label]:visible')).toHaveCount(1)
    await expect(page.locator('#tags-list > [data-label]:visible')).toHaveAttribute(
      'data-label', 'accessibility'
    )
  })

  test('filters technologies, updates group counts, and exposes an empty state', async ({ page }) => {
    await page.goto('/technologies/')

    const search = page.getByRole('searchbox', { name: 'Find a technology' })

    await search.fill('TypeScript')

    await expect(page.locator('#technology-filter-status')).toHaveText('1 technology found.')
    await expect(page.locator('[data-technology-item]:visible')).toHaveCount(1)
    await expect(page.locator('[data-technology-group]:visible [data-technology-group-count]')).toHaveText('1')

    await search.fill('not-a-real-technology')

    await expect(page.locator('#technology-filter-status')).toHaveText('0 technologies found.')
    await expect(page.locator('[data-technologies-empty]')).toBeVisible()
  })
})
