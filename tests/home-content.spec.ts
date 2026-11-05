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
  const covers = latestWriting.getByRole('img')

  await expect(covers).toHaveCount(4)
  for (const cover of await covers.all()) {
    await cover.scrollIntoViewIfNeeded()
    await expect(cover).toHaveAttribute('alt', /\S/u)
    await expect.poll(() => cover.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) return false

      return element.complete && element.naturalWidth > 0
    })).toBe(true)
  }
  const dates = await latestWriting.locator('time').evaluateAll(elements => elements.map(element => Date.parse(element.getAttribute('datetime') ?? '')))

  expect(dates).toEqual([...dates].sort((a, b) => b - a))
  await expect(writing.getByRole('region', { name: 'Start here' }).getByRole('link')).toHaveCount(3)
  const articlePaths = await writing.locator('article a').evaluateAll(links => links.map(link => link.getAttribute('href')))

  expect(articlePaths).toHaveLength(7)
  expect(new Set(articlePaths).size, 'Latest writing and Start here must show seven distinct articles').toBe(7)
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

  await expect(page.locator('[data-site-footer] a[href="mailto:hi@santi020k.com"]')).toBeVisible()

  await community.getByRole('link', { name: /Lessons from the work/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/speaking\/$/)
  await page.goBack()
  await expect(community).toBeVisible()
})

for (const theme of ['light', 'dark'] as const) {
  test(`homepage writing preserves complete readable articles with enlarged text in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/')
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%'
        await document.fonts.ready
      })
      const articles = page.getByRole('list', { name: 'Latest writing' }).getByRole('link')

      await expect(articles).toHaveCount(4)
      for (const article of await articles.all()) {
        await article.focus()
        await expect(article).toBeFocused()
        await expect(article).toBeInViewport()
        await expect(article).toHaveCSS('outline-style', 'solid')
        const clipped = await article.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h4, p, [data-writing-action]')].flatMap(item => {
            const range = document.createRange()

            range.selectNodeContents(item)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
            )) ?
              [item.textContent] :
              []
          })
        })

        expect(clipped, `Article text must fit at ${width}px and 200%`).toEqual([])
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  })

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

    for (const width of [320, 375, 768, 1024, 1440]) {
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

    await page.locator('[data-site-footer] a[href="/about/"]').click()
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(page.locator('[data-site-footer]')).toBeVisible()
    await page.goBack()
    await expect(page.locator('[data-home-content]')).toBeVisible()
  })
}
