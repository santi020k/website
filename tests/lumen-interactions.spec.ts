import { expect, test } from '@playwright/test'

test('resume print styles hide the Lumen skip link', async ({ page }) => {
  await page.goto('/resume/')

  const skipLink = page.locator('[data-slot="skip-link"]')

  await expect(skipLink).toHaveCount(1)
  await page.emulateMedia({ media: 'print' })
  await expect(skipLink).toBeHidden()
})

test.describe('Organization carousel Lumen Button controls', () => {
  test('previous and next controls are real buttons with accessible names and 44px targets', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 })
    await page.goto('/about/')

    const carousel = page.locator('[data-organization-carousel]')
    const previousButton = carousel.getByRole('button', { name: 'Show previous organizations' })
    const nextButton = carousel.getByRole('button', { name: 'Show next organizations' })

    await expect(previousButton).toHaveAttribute('aria-controls', 'organization-carousel-items')
    await expect(nextButton).toHaveAttribute('aria-controls', 'organization-carousel-items')

    for (const button of [previousButton, nextButton]) {
      const box = await button.boundingBox()

      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('previous control disables at the first page and keyboard paging keeps it in sync', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 })
    await page.goto('/about/')

    const carousel = page.locator('[data-organization-carousel]')
    const previousButton = carousel.getByRole('button', { name: 'Show previous organizations' })
    const nextButton = carousel.getByRole('button', { name: 'Show next organizations' })

    await expect(previousButton).toBeDisabled()
    await expect(nextButton).toBeEnabled()

    await nextButton.focus()
    await page.keyboard.press('ArrowRight')

    await expect(previousButton).toBeEnabled()

    await previousButton.focus()
    await page.keyboard.press('ArrowLeft')

    await expect(previousButton).toBeDisabled()
  })
})

test.describe('Blog topic filter aria-current semantics', () => {
  test('marks "All posts" as the current page on the unfiltered blog index', async ({ page }) => {
    await page.goto('/blog/')

    const filter = page.locator('[data-blog-tag-filter]')
    const allPosts = filter.getByRole('link', { name: 'All posts' })

    await expect(allPosts).toHaveAttribute('aria-current', 'page')
    await expect(allPosts).toHaveAttribute('href', '/blog/')
    await expect(allPosts).toHaveAttribute('data-variant', 'brand')

    const tagLinks = filter.getByRole('link').filter({ hasNotText: 'All posts' })
    const tagCount = await tagLinks.count()

    expect(tagCount).toBeGreaterThan(0)

    for (const link of await tagLinks.all()) await expect(link).not.toHaveAttribute('aria-current')
  })

  test('marks the active tag as current on a filtered archive without changing its link target', async ({ page }) => {
    await page.goto('/blog/tags/react/')

    const filter = page.locator('[data-blog-tag-filter]')
    const activeTag = filter.getByRole('link', { name: /react/i })
    const allPosts = filter.getByRole('link', { name: 'All posts' })

    await expect(activeTag).toHaveAttribute('aria-current', 'page')
    await expect(activeTag).toHaveAttribute('href', '/blog/tags/react/')
    await expect(activeTag).toHaveAttribute('data-variant', 'brand')

    await expect(allPosts).not.toHaveAttribute('aria-current')
    await expect(allPosts).toHaveAttribute('href', '/blog/')
    await expect(allPosts).toHaveAttribute('data-variant', 'outline')
  })
})

test.describe('CodeTabs keyboard navigation and preference persistence', () => {
  const postPath = '/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/'

  test('arrow keys move selection with a looped roving tabindex', async ({ page }) => {
    await page.goto(postPath)

    const installTabs = page.getByRole('tablist', {
      name: 'Choose a package manager to install the development dependencies'
    })
    const npmTab = installTabs.getByRole('tab', { exact: true, name: 'npm' })
    const yarnTab = installTabs.getByRole('tab', { name: 'yarn' })
    const bunTab = installTabs.getByRole('tab', { name: 'Bun' })

    await expect(npmTab).toHaveAttribute('aria-selected', 'true')

    await npmTab.focus()
    await page.keyboard.press('ArrowRight')

    await expect(yarnTab).toHaveAttribute('aria-selected', 'true')
    await expect(yarnTab).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(npmTab).toHaveAttribute('aria-selected', 'true')

    // Looping backwards past the first tab should wrap to the last one.
    await page.keyboard.press('ArrowLeft')
    await expect(bunTab).toHaveAttribute('aria-selected', 'true')
    await expect(bunTab).toBeFocused()
  })

  test('persists the selected package manager, syncs other tab groups, and survives a reload', async ({ page }) => {
    await page.goto(postPath)

    const installTabs = page.getByRole('tablist', {
      name: 'Choose a package manager to install the development dependencies'
    })
    const prepareTabs = page.getByRole('tablist', {
      name: 'Choose a package manager to prepare the Husky hooks'
    })

    await installTabs.getByRole('tab', { name: 'pnpm' }).click()

    await expect(installTabs.getByRole('tab', { name: 'pnpm' })).toHaveAttribute('aria-selected', 'true')
    await expect(prepareTabs.getByRole('tab', { name: 'pnpm' })).toHaveAttribute('aria-selected', 'true')

    const storedValue = await page.evaluate(() => localStorage.getItem('preferred-package-manager'))
    expect(storedValue).toBe('pnpm')

    await page.reload()

    await expect(installTabs.getByRole('tab', { name: 'pnpm' })).toHaveAttribute('aria-selected', 'true')
    await expect(prepareTabs.getByRole('tab', { name: 'pnpm' })).toHaveAttribute('aria-selected', 'true')
  })
})
