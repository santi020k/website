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

  test('named topics match readable labels and legacy slugs, then restore count order', async ({ page }) => {
    await page.goto('/blog/tags/')
    const entries = page.locator('#tags-list > [data-label]')
    const initialOrder = await entries.evaluateAll(items => items.map(item => item.getAttribute('data-label')))
    const search = page.getByRole('searchbox', { name: 'Find a topic' })

    for (const [query, slug, name] of [
      ['Developer experience', 'developer-experience', 'Developer experience'],
      ['  #DEVELOPER-EXPERIENCE  ', 'developer-experience', 'Developer experience'],
      ['Next.js', 'nextjs', 'Next.js'],
      ['nextjs', 'nextjs', 'Next.js'],
      ['CI/CD', 'ci-cd', 'CI/CD'],
      ['#ci-cd', 'ci-cd', 'CI/CD']
    ] as const) {
      await search.fill(query)
      const result = page.locator('#tags-list > [data-label]:visible')

      await expect(result).toHaveCount(1)
      await expect(result.getByRole('link')).toHaveAttribute('href', `/blog/tags/${slug}/`)
      await expect(result.locator('[data-topic-name]')).toHaveText(name)
      await expect(page.locator('#tag-filter-status')).toHaveText('1 topic found.')
    }
    await search.fill('')
    await page.getByRole('button', { name: 'A → Z' }).press('Enter')
    const names = await entries.locator('[data-topic-name]').evaluateAll(elements => elements.map(element => element.textContent))

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
    await page.getByRole('button', { name: 'By count' }).press('Enter')
    expect(await entries.evaluateAll(items => items.map(item => item.getAttribute('data-label')))).toEqual(initialOrder)
  })

  for (const theme of ['light', 'dark']) {
    test(`named topic links retain their footprint and keyboard feedback in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto('/blog/tags/')
      const search = page.getByRole('searchbox', { name: 'Find a topic' })

      await search.fill('Developer experience')
      const link = page.locator('#tags-list a:visible')

      await expect(link).toHaveCount(1)
      await expect(link).toHaveAccessibleName('Developer experience 16 posts')
      await link.scrollIntoViewIfNeeded()
      const resting = await link.boundingBox()
      const background = await link.evaluate(element => getComputedStyle(element).backgroundColor)

      await link.hover()
      await expect(link).not.toHaveCSS('background-color', background)
      await expect(link.locator('[data-topic-name]')).toHaveCSS('text-decoration-line', 'underline')
      await expect(link.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'arrow-exchange')
      expect(await link.boundingBox()).toEqual(resting)
      await page.mouse.move(0, 0)
      await link.focus()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await expect(link.locator('[data-topic-arrow]')).toHaveAttribute('aria-hidden', 'true')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(link).toHaveCSS('transition-property', 'none')
      await expect(link.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'none')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL('/blog/tags/developer-experience/')
    })
  }

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
