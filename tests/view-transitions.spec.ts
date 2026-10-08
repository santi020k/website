import { expect, type Locator, test } from '@playwright/test'

// Observe every paint for the original 500ms stability window, so a delayed
// focus scroll cannot hide behind an eventual-success assertion.
const expectStableTop = async (locator: Locator, expected: number) => {
  const positions = await locator.evaluate(async element => {
    const values: number[] = []
    const deadline = performance.now() + 500

    do {
      values.push(element.getBoundingClientRect().top)
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
    } while (performance.now() < deadline)

    values.push(element.getBoundingClientRect().top)
    return values
  })

  for (const position of positions) expect(position).toBeCloseTo(expected, 0)
}

test.describe('View transitions', () => {
  test('keeps global transition UI working after a body swap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    const progress = page.locator('#nav-progress')
    await progress.evaluate(element => {
      element.dataset.transitionTest = 'persistent'
    })

    await page
      .getByRole('navigation', { name: 'Main menu' })
      .first()
      .getByRole('link', { name: 'About' })
      .click()

    await expect(page).toHaveURL(/\/about\/$/)
    await expect(progress).toHaveAttribute('data-transition-test', 'persistent')
    await expect(page.locator('#main')).toBeFocused()

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
    await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')

    await page.route('**/blog/', async route => {
      await new Promise(resolve => setTimeout(resolve, 400))
      await route.continue()
    })

    await page
      .getByRole('navigation', { name: 'Main menu' })
      .first()
      .getByRole('link', { name: 'Blog' })
      .click()

    await expect(progress).toHaveClass(/is-loading/)
    await expect(page).toHaveURL(/\/blog\/$/)
    await expect(progress).toHaveClass(/is-complete/)
  })

  test('preserves a cross-page fragment target', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.id = 'transition-fragment-test'
      link.href = '/portfolio/smith-commerce/#technologies'
      link.textContent = 'View technologies'
      document.body.append(link)
    })

    await page.locator('#transition-fragment-test').click()

    await expect(page).toHaveURL(/\/portfolio\/smith-commerce\/#technologies$/)
    await expect(page.locator('#technologies')).toBeInViewport()
    await expect(page.locator('#main')).toBeFocused()
  })

  test('keeps the topic filter in place while filtering blog posts', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/blog/')

    const topicFilter = page.locator('[data-blog-tag-filter]')

    await topicFilter.evaluate(element => {
      element.scrollIntoView({ behavior: 'instant', block: 'center' })
    })

    const initialFilterTop = await topicFilter.evaluate(element => element.getBoundingClientRect().top)

    await topicFilter.getByRole('link', { name: /react/i }).click()

    await expect(page).toHaveURL(/\/blog\/tags\/react\/$/)
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/)
    await expect(topicFilter).toBeVisible()

    const filteredPagePosition = await topicFilter.evaluate(element => ({
      scrollY: window.scrollY,
      top: element.getBoundingClientRect().top
    }))

    expect(filteredPagePosition.scrollY).toBeGreaterThan(0)
    await expect.poll(() => topicFilter.evaluate(element => element.getBoundingClientRect().top))
      .toBeCloseTo(initialFilterTop, 0)

    await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')

    // Position must remain stable after the page-load event, including any
    // browser scrolling queued while focus moved to the new document.
    await expectStableTop(topicFilter, initialFilterTop)

    const filterTopBeforeReset = await topicFilter.evaluate(element => element.getBoundingClientRect().top)

    await topicFilter.getByRole('link', { name: 'All posts' }).click()

    await expect(page).toHaveURL(/\/blog\/$/)
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/)

    await expect.poll(() => topicFilter.evaluate(element => element.getBoundingClientRect().top))
      .toBeCloseTo(filterTopBeforeReset, 0)
    await expectStableTop(topicFilter, initialFilterTop)
  })

  test('disables smooth scrolling when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const scrollBehavior = await page.locator('html').evaluate(
      element => getComputedStyle(element).scrollBehavior
    )

    expect(scrollBehavior).toBe('auto')
  })
})
