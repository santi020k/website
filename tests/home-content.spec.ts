import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('homepage keeps project discovery and reading connected to real content', async ({ page }) => {
  await page.goto('/')
  const work = page.locator('[data-home-showcase="work"]')
  const projects = page.locator('[data-home-showcase="projects"]')
  const writing = page.locator('[data-home-writing]')

  await expect(work.locator('a[href^="/portfolio/"]')).toHaveCount(4)
  await expect(projects.locator('a[href^="/portfolio/"]')).toHaveCount(4)
  await expect(writing.locator('ol a')).toHaveCount(4)
  await expect(writing.locator('a[href="/feed.xml"]')).toHaveText('Follow via RSS')

  const project = work.locator('[data-showcase-feature]')
  const projectTitle = await project.locator('h3').innerText()
  const projectPath = await project.getAttribute('href')
  await project.click()
  await expect(page).toHaveURL(new URL(projectPath ?? '', page.url()).href)
  await expect(page.locator('main h1')).toContainText(projectTitle)
  await page.goBack()

  const article = writing.locator('ol a').first()
  const articleTitle = await article.locator('h3').innerText()
  const articlePath = await article.getAttribute('href')
  await article.click()
  await expect(page).toHaveURL(new URL(articlePath ?? '', page.url()).href)
  await expect(page.locator('main h1')).toContainText(articleTitle)
  await page.goBack()

  await expect(page.locator('footer a[href="mailto:hi@santi020k.com"]')).toBeVisible()
})

for (const theme of ['light', 'dark']) {
  test(`homepage content reflows and stays accessible in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)

      for (const link of await page.locator('[data-home-content] a').all()) {
        await link.focus()
        await expect(link).toBeFocused()
        await expect(link).toBeInViewport()
      }

      await expectNoUnexpectedAccessibilityViolations(page)
    }

    await page.locator('footer a[href="/about/"]').click()
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(page.locator('footer')).toBeVisible()
    await page.goBack()
    await expect(page.locator('[data-home-content]')).toBeVisible()
  })
}
