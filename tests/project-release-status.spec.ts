import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const launchPath = '/blog/postlens-2-is-live/'

test('release states stay distinct, readable and linked at mobile and desktop widths', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const project of ['postlens', 'roadscore']) {
      await page.goto(`/portfolio/${project}/`)
      const release = page.locator('[data-project-release-split]')

      await expect(release).toHaveCount(1)
      await release.scrollIntoViewIfNeeded()
      await expect(release.locator('h4')).toHaveCount(2)
      const geometry = await release.locator('[data-release-state]').evaluateAll(states => states.map(state => {
        const { x, y } = state.getBoundingClientRect()

        return { x, y }
      }))

      expect(geometry).toHaveLength(2)
      expect(width < 600 ? geometry[0]?.x === geometry[1]?.x : geometry[0]?.y === geometry[1]?.y).toBe(true)
      const external = release.locator('a[target="_blank"]').first()

      await expect(external).toHaveAttribute('rel', /noopener/u)
      await expect(external).toHaveAttribute('rel', /noreferrer/u)
      await page.keyboard.press('Tab')
      await external.focus()
      await expect(external).not.toHaveCSS('outline-style', 'none')
      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => {
          document.documentElement.dataset.theme = value
        }, theme)
        const accessibility = await new AxeBuilder({ page }).include('[data-project-release-split]').analyze()

        expect(accessibility.violations).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      }
    }
  }
})

test('the launched PostLens state connects to the new article and preserves the earlier article', async ({ page, request }) => {
  await page.goto('/portfolio/postlens/#available-today-and-in-development')
  await expect(page.locator('#available-today-and-in-development')).toHaveCount(1)
  const release = page.locator('[data-project-release-split]')

  await expect(release).toContainText('Available now')
  await expect(release).toContainText('Awaiting Meta approval')
  await expect(page.locator('main')).not.toContainText('upcoming PostLens 2')
  await release.getByRole('link', { name: 'Read the PostLens 2 launch note' }).click()
  await expect(page).toHaveURL(new RegExp(`${launchPath}$`, 'u'))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('PostLens 2 is live: a more complete photo studio')
  await expect(page.locator('main')).toContainText('direct Instagram publishing')
  const cover = page.locator('[data-post-cover] img')

  await expect(cover).toBeVisible()
  const loaded = await cover.evaluate(image => (
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  ))

  expect(loaded).toBe(true)
  await page.goto('/blog/postlens-private-on-device-content-studio/')
  await expect(page.locator('[data-article-update-note]')).toContainText('PostLens 2 is now live')
  await expect(page.locator('[data-article-update-note] a')).toHaveAttribute('href', launchPath)
  const feed = await request.get('/feed.xml')

  expect(feed.ok()).toBe(true)
  expect(await feed.text()).toContain(launchPath)
})
