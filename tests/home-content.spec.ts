import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('homepage keeps project discovery and reading connected to real content', async ({ page }) => {
  await page.goto('/')
  const work = page.locator('[data-home-showcase="work"]')
  const projects = page.locator('[data-home-showcase="projects"]')
  const writing = page.locator('[data-home-writing]')
  const latestWriting = writing.getByRole('list', { name: 'Latest writing' })

  await expect(work.locator('a[href^="/portfolio/"]')).toHaveCount(4)
  await expect(projects.locator('a[href^="/portfolio/"]')).toHaveCount(4)
  await expect(latestWriting.getByRole('link')).toHaveCount(4)
  await expect(writing.getByRole('region', { name: 'Start here' }).getByRole('link')).toHaveCount(3)
  await expect(writing.locator('a[href="/feed.xml"]')).toHaveText('Follow via RSS')

  const community = page.getByRole('region', { name: 'Better when shared.' })
  const meetup = community.getByRole('link', { name: /ReactJS Colombia/ })

  await expect(community.getByRole('link')).toHaveCount(3)
  await expect(meetup).toHaveAttribute('href', 'https://www.meetup.com/react-js-medellin/')
  await expect(meetup).toHaveAttribute('target', '_blank')
  await expect(meetup).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(meetup).toHaveAccessibleName(/Join the community/)
  await expect(community.getByRole('link', { name: /Lessons from the work/ })).toHaveAccessibleName(/Explore speaking/)

  const project = work.locator('[data-showcase-feature]')
  const projectTitle = await project.locator('h3').innerText()
  const projectPath = await project.getAttribute('href')
  await project.click()
  await expect(page).toHaveURL(new URL(projectPath ?? '', page.url()).href)
  await expect(page.locator('main h1')).toContainText(projectTitle)
  await page.goBack()

  const article = latestWriting.getByRole('link').first()
  const articleTitle = await article.getByRole('heading', { level: 4 }).innerText()
  const articlePath = await article.getAttribute('href')
  await article.click()
  await expect(page).toHaveURL(new URL(articlePath ?? '', page.url()).href)
  await expect(page.locator('main h1')).toContainText(articleTitle)
  await page.goBack()

  await expect(page.locator('footer a[href="mailto:hi@santi020k.com"]')).toBeVisible()

  await community.getByRole('link', { name: /Lessons from the work/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/speaking\/$/)
  await page.goBack()
  await expect(community).toBeVisible()
})

for (const theme of ['light', 'dark'] as const) {
  test(`homepage community remains readable with enlarged text in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%'
        await document.fonts.ready
      })

      const community = page.getByRole('region', { name: 'Better when shared.' })

      await expect(community.getByRole('link')).toHaveCount(3)
      const clipped = await community.evaluate(element => {
        const bounds = element.getBoundingClientRect()

        return [...element.querySelectorAll('h2, h3, p, a')].flatMap(item => {
          const range = document.createRange()

          range.selectNodeContents(item)
          return [...range.getClientRects()].some(rect => rect.width > 0 && (
            rect.left < bounds.left - 1 || rect.right > bounds.right + 1
          )) ?
            [item.textContent] :
            []
        })
      })

      expect(clipped).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      for (const link of await community.getByRole('link').all()) {
        await link.focus()
        await expect(link).toBeFocused()
        await expect(link).toHaveCSS('outline-style', 'solid')
      }
    }
  })

  test(`homepage content reflows and stays accessible in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)

      const excerpts = page.locator('[data-home-writing] [data-writing-description]')

      await expect(excerpts).toHaveCount(4)
      for (const excerpt of await excerpts.all()) {
        await expect(excerpt).toBeVisible()
      }

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
