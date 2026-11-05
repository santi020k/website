import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 1440]) {
    for (const textSize of [100, 200]) {
      test(`statistics preserve their content at ${width}px and ${textSize}% in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        // Technology pages use their own evidence ledger/index, covered in those suites.
        for (const route of ['/speaking/', '/developer-experience/']) {
          await page.goto(route)
          await page.evaluate(size => {
            document.documentElement.style.fontSize = `${size}%`
          }, textSize)
          await page.evaluate(() => document.fonts.ready)
          const cards = page.locator('[data-sculpted-stat]')

          expect(await cards.count()).toBeGreaterThan(0)
          await expect(cards.locator('[data-stat-source]')).toHaveCount(route === '/speaking/' ? 3 : 0)
          await cards.first().scrollIntoViewIfNeeded()
          for (const card of await cards.all()) {
            await expect(card.locator('[data-slot="stat-label"]')).toBeVisible()
            await expect(card.locator('[data-stat-value]')).toBeVisible()
            await expect(card.locator('[data-stat-description]')).toBeVisible()
            const overflow = await card.evaluate(element => {
              const cardBounds = element.getBoundingClientRect()

              return [...element.querySelectorAll('[data-stat-masthead], [data-stat-metric], [data-slot="stat-label"], [data-stat-description], [data-stat-source], [data-stat-source] a')].some(child => {
                const bounds = child.getBoundingClientRect()

                return bounds.left < cardBounds.left - 1 ||
                  bounds.right > cardBounds.right + 1 ||
                  bounds.bottom > cardBounds.bottom + 1 ||
                  child.scrollWidth > child.clientWidth + 1
              })
            })

            expect(overflow, `${route} statistics must reflow without clipping content`).toBe(false)
          }
        }
      })
    }
  }
}

test('statistics retain word qualifiers, text values, and accessible animated numbers', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/speaking/')
  const cards = page.locator('[data-sculpted-stat]')
  const community = cards.filter({ has: page.locator('[data-slot="stat-label"]', { hasText: 'Community' }) })
  const writing = cards.filter({ has: page.locator('[data-slot="stat-label"]', { hasText: 'Published writing' }) })

  await expect(community.locator('[data-stat-metric]')).toHaveText(/Since\s+2017/u)
  await expect(writing.locator('[data-stat-metric]')).toHaveText(/\d+\s+posts/u)
  // Topic archives close with reading paths instead of repeating archive statistics.
  await page.goto('/developer-experience/')
  const outcome = cards.filter({ has: page.locator('[data-slot="stat-label"]', { hasText: 'Delivery outcome' }) })

  await expect(outcome.locator('[data-ui-animated-number-output]')).toHaveText('-75%')
  await expect(outcome.locator('[data-ui-animated-number] .ui-sr-only')).toHaveText('-75%')
})

test('archive summaries use the full row for their actual number of statistics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // Series and individual topic archives no longer carry statistics. The Topics
  // ending links each of its statistics to their evidence (7cbf0605).
  await page.goto('/blog/tags/')
  const cards = page.locator('[data-sculpted-stat]')

  await expect(cards).toHaveCount(3)
  await expect(cards.locator('[data-stat-source]')).toHaveCount(3)
  const alignment = await cards.last().evaluate(element => {
    const card = element.getBoundingClientRect()
    const grid = element.parentElement?.getBoundingClientRect()

    if (!grid) throw new Error('Statistics need a containing grid')
    return Math.abs(card.right - grid.right)
  })

  expect(alignment, 'the Topics ending must not reserve empty statistic columns').toBeLessThanOrEqual(1)
})
