import { expect, test } from '@playwright/test'
import { getRouteManifestImage } from '@santi020k/og'
import { z } from 'astro/zod'

import { routeManifestSchema } from '../src/data/og-manifest'

test.describe('Index filters', () => {
  test('filters blog topics and announces the result count', async ({ page }) => {
    await page.goto('/blog/tags/')

    const opening = page.locator('[data-topic-opening]')
    const totalTopics = await page.locator('#tags-list > [data-label]').count()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Browse by topic.')
    await expect(opening.locator('[data-topic-total]')).toHaveText(`${totalTopics} topics`)
    await expect(opening.getByRole('link', { name: 'Back to blog' })).toHaveAttribute('href', '/blog/')
    await expect(opening.getByRole('link', { name: 'Prefer a connected reading path?' }))
      .toHaveAttribute('href', '/blog/series/')

    await page.getByRole('searchbox', { name: 'Find a topic' }).fill('accessibility')
    await expect(opening.locator('[data-topic-total]')).toHaveText(`${totalTopics} topics`)

    await expect(page.locator('#tag-filter-status')).toHaveText('1 topic found.')
    await expect(page.locator('#tags-list > [data-label]:visible')).toHaveCount(1)
    await expect(page.locator('#tags-list > [data-label]:visible')).toHaveAttribute(
      'data-label', 'accessibility'
    )

    const search = page.getByRole('searchbox', { name: 'Find a topic' })
    await search.fill('not-a-real-topic')
    await expect(page.locator('#tag-filter-status')).toHaveText('0 topics found.')
    await expect(page.locator('[data-tags-empty]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No topics match that search.' })).toBeVisible()
    await expect(page.locator('#tags-list > [data-label]:visible')).toHaveCount(0)
    await expect(search).toBeFocused()
    await search.fill('')
    await expect(page.locator('[data-tags-empty]')).toBeHidden()
    const topics = page.locator('#tags-list > [data-label]')
    await expect(page.locator('#tags-list > [data-label]:visible')).toHaveCount(await topics.count())
  })

  test('filters technologies into an evidence ledger and exposes an empty state', async ({ page }) => {
    await page.goto('/technologies/')

    const search = page.getByRole('searchbox', { name: 'Find a technology' })

    await search.fill('TypeScript')

    await expect(page.locator('#technology-filter-status')).toHaveText('1 technology found.')
    await expect(page.locator('[data-technology-item]:visible')).toHaveCount(1)
    await expect(page.locator('[data-technology-matches-list] a')).toHaveAccessibleName('TypeScript Core 20 entries')
    await expect(page.locator('[data-technology-groups]')).toBeHidden()

    await search.fill('not-a-real-technology')

    await expect(page.locator('#technology-filter-status')).toHaveText('0 technologies found.')
    await expect(page.locator('[data-technologies-empty]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No technologies match that search.' })).toBeVisible()
    await expect(page.locator('[data-technologies-empty] p')).toHaveText('Try a broader term or clear the search field.')
    await expect(search).toBeFocused()
    await expect(page.locator('[data-technology-group]:visible')).toHaveCount(0)
    await expect(page.locator('[data-technology-item]:visible')).toHaveCount(0)
    await search.fill('')
    await expect(page.locator('[data-technologies-empty]')).toBeHidden()
    await expect(page.locator('[data-technology-group]:visible')).toHaveCount(3)
    const items = page.locator('[data-technology-item]:visible')

    await expect(page.locator('#technology-filter-status')).toHaveText(`Showing all ${await items.count()} technologies.`)
  })

  test('finds the topic for prefixed, padded, and plain accessibility queries, then restores all on clear', async ({ page }) => {
    await page.goto('/blog/tags/')

    const search = page.getByRole('searchbox', { name: 'Find a topic' })
    const status = page.locator('#tag-filter-status')
    const empty = page.locator('[data-tags-empty]')
    const allTopics = page.locator('#tags-list > [data-label]')
    const visibleTopics = page.locator('#tags-list > [data-label]:visible')
    const totalTopics = await allTopics.count()

    expect(totalTopics).toBeGreaterThan(1)

    for (const query of ['#accessibility', '  ACCESSIBILITY  ', 'accessibility']) {
      await search.fill(query)

      await expect(status).toHaveText('1 topic found.')
      await expect(visibleTopics).toHaveCount(1)
      await expect(visibleTopics).toHaveAttribute('data-label', 'accessibility')
      await expect(visibleTopics.getByRole('link')).toHaveAttribute('href', '/blog/tags/accessibility/')
      await expect(empty).toBeHidden()
    }

    await search.fill('')

    await expect(status).toHaveText(`Showing all ${totalTopics} topics.`)
    await expect(visibleTopics).toHaveCount(totalTopics)
    await expect(empty).toBeHidden()
  })

  test('finds CI/CD by its slash label and opens its technology page with a served social image', async ({ page }) => {
    await page.goto('/technologies/')

    await page.getByRole('searchbox', { name: 'Find a technology' }).fill('CI/CD')

    const items = page.locator('[data-technology-item]:visible')

    await expect(page.locator('#technology-filter-status')).toHaveText('1 technology found.')
    await expect(items).toHaveCount(1)
    await expect(items).toHaveAttribute('data-label', 'CI/CD')

    const link = items.getByRole('link', { name: /^CI\/CD\b/u })

    await expect(link).toHaveAttribute('href', '/technologies/ci-cd/')
    await link.click()

    await expect(page).toHaveURL('/technologies/ci-cd/')
    await expect(page).toHaveTitle('CI/CD · Technology | santi020k')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('CI/CD In practice.')

    const response = await page.request.get('/og/manifest.json')

    const content: unknown = await response.json()

    expect(response.ok()).toBe(true)
    const manifest = routeManifestSchema.parse(content)
    const imageURL = z.string().parse(getRouteManifestImage(manifest, '/technologies/ci-cd/')?.url)

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content', new URL(imageURL, 'https://santi020k.com').href
    )
    const imageResponse = await page.request.get(imageURL)

    expect(imageResponse.ok()).toBe(true)
    expect(imageResponse.headers()['content-type']).toContain('image/webp')
  })
})
