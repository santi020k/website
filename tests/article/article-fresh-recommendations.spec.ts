import { expect, test } from '@playwright/test'

const supabase = '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/'
const migration = '/blog/migrate-eslint-8-or-less-to-eslint-9/'
const freshDestinations = [
  '/blog/open-sourcing-santi020k-auth-cloudflare/',
  '/blog/deterministic-open-graph-images-without-design-lock-in/'
] as const

test.use({ reducedMotion: 'reduce' })

test('related writing skips the series connection and keeps the next eligible cards', async ({ page }) => {
  await page.route('https://giscus.app/**', route => route.abort())
  await page.goto(supabase)
  await expect(page.locator('[data-series-connection] a')).toHaveAttribute('href', migration)
  const cards = page.locator('[data-post-gallery-card] > a')

  await expect(cards).toHaveCount(2)
  expect(await cards.evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(freshDestinations)
  await cards.first().focus()
  await expect(cards.first()).toBeFocused()
  await cards.first().press('Enter')
  await expect(page).toHaveURL(freshDestinations[0])
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const route of [supabase, migration]) {
    test(`recommendations are already distinct in the HTML for ${route}`, async ({ page }) => {
      await page.goto(route)
      const recommended = await page.locator('[data-reference-link]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => href?.startsWith('/blog/')))
      const cards = page.locator('[data-post-gallery-card] > a')

      await expect(cards).toHaveCount(2)
      const destinations = await cards.evaluateAll(links => links.map(link => link.getAttribute('href')))

      expect(destinations.filter(href => recommended.includes(href))).toEqual([])
    })
  }
})
