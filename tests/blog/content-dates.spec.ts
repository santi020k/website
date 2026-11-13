import { expect, test } from '@playwright/test'

const articlePath = '/blog/building-roadscore-offline-road-trip-game/'
const articleUrl = `https://santi020k.com${articlePath}`

test('authored article dates agree across visible copy, metadata, and feeds', async ({ page }) => {
  await page.goto(articlePath)
  const published = page.locator('[data-publication-field="published"] time')

  await expect(published).toHaveText('Sep 4, 2026')
  await expect(published).toHaveAttribute('datetime', '2026-09-04T00:00:00.000Z')
  await expect(page.locator('meta[property="article:published_time"]'))
    .toHaveAttribute('content', '2026-09-04T00:00:00.000Z')

  const feedResponse = await page.request.get('/feed.json')
  const feed: unknown = await feedResponse.json()

  expect(feed).toMatchObject({
    items: expect.arrayContaining([
      expect.objectContaining({ url: articleUrl, date_published: '2026-09-04T00:00:00.000Z' })
    ])
  })

  const rssResponse = await page.request.get('/feed.xml')
  const rssDate = await page.evaluate(({ xml, url }) => {
    const document = new DOMParser().parseFromString(xml, 'application/xml')
    const item = [...document.querySelectorAll('item')].find(entry => entry.querySelector('link')?.textContent === url)

    return item?.querySelector('pubDate')?.textContent
  }, { xml: await rssResponse.text(), url: articleUrl })

  expect(rssDate).toBe('Fri, 04 Sep 2026 00:00:00 GMT')
})

test('project timelines and the resume retain authored month boundaries', async ({ page }) => {
  await page.goto('/portfolio/pads/')
  const timeline = page.locator('[data-project-meta="timeline"] time')

  await expect(timeline).toHaveText(['Jan 2020', 'Jul 2021'])
  await expect(timeline.first()).toHaveAttribute('datetime', '2020-01')
  await expect(timeline.last()).toHaveAttribute('datetime', '2021-07')

  await page.goto('/resume/')
  const pads = page.locator('[data-resume-entry], [data-resume-compact-entry]')
    .filter({ has: page.getByRole('heading', { name: /PADS/u }) })

  await expect(pads.locator('[data-resume-date]')).toHaveText('Jan 2020 – Jul 2021')
})
