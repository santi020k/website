import { expect, type Page, test } from '@playwright/test'

const article = '/blog/responsive-design-standards-that-scale-across-components/'
const nextArticle = '/blog/code-standards-that-scale-with-a-team/'

test.use({ reducedMotion: 'reduce' })

const scrollThroughArticle = async (page: Page, fraction: number) => {
  await page.locator('#article-content').evaluate((element, position) => {
    const bounds = element.getBoundingClientRect()
    const end = bounds.bottom + scrollY - innerHeight
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
    const start = Math.min(bounds.top + scrollY - padding, end)

    window.scrollTo({ top: start + (end - start) * position, behavior: 'instant' })
  }, fraction)
}

test.beforeEach(async ({ page }) => {
  await page.route('https://giscus.app/**', route => route.abort())
})

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    for (const textSize of [100, 200]) {
      test(`article progress ends with the prose at ${width}px, ${textSize}% text, ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto(article)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const progress = page.getByRole('progressbar', { name: 'Reading progress', exact: true })

        await expect(progress).toHaveCount(1)
        await expect(progress).toHaveAttribute('aria-valuenow', '0')
        await scrollThroughArticle(page, 0)
        await expect(progress).toHaveAttribute('aria-valuenow', '0')
        await scrollThroughArticle(page, 0.5)
        await expect(progress).toHaveAttribute('aria-valuenow', '50')
        await scrollThroughArticle(page, 1)
        await expect(progress).toHaveAttribute('aria-valuenow', '100')
        await expect.poll(() => progress.evaluate(element => {
          const bar = element.firstElementChild
          if (!bar) throw new Error('The reading indicator is missing')
          return Math.round(bar.getBoundingClientRect().width / element.getBoundingClientRect().width * 100)
        })).toBe(100)
        await page.keyboard.press('End')
        await expect(progress).toHaveAttribute('aria-valuenow', '100')
        await page.getByRole('navigation', { name: 'Page-end navigation', exact: true }).getByRole('link', { name: 'Back to top', exact: true }).click()
        await expect(progress).toHaveAttribute('aria-valuenow', '0')
      })
    }
  }
}

test('progress responds to content reflow, short articles, and empty content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(article)
  await page.evaluate(() => document.fonts.ready)
  const progress = page.getByRole('progressbar', { name: 'Reading progress', exact: true })
  const content = page.locator('#article-content')

  await scrollThroughArticle(page, 0.5)
  await expect(progress).toHaveAttribute('aria-valuenow', '50')
  await content.evaluate(element => {
    const addition = document.createElement('p')
    addition.textContent = 'Additional article content.'
    addition.style.height = '1000px'
    element.append(addition)
  })
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(50)
  await content.evaluate(element => {
    const paragraph = document.createElement('p')
    paragraph.textContent = 'A short article that fits in one viewport.'
    element.replaceChildren(paragraph)
  })
  await content.scrollIntoViewIfNeeded()
  await expect(progress).toHaveAttribute('aria-valuenow', '100')
  await content.evaluate(element => {
    element.replaceChildren()
  })
  await expect(progress).toHaveAttribute('aria-valuenow', '0')
})

test('progress recalculates after resizing the reading viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(article)
  await page.evaluate(() => document.fonts.ready)
  const progress = page.getByRole('progressbar', { name: 'Reading progress', exact: true })

  await scrollThroughArticle(page, 0.5)
  await expect(progress).toHaveAttribute('aria-valuenow', '50')
  await page.setViewportSize({ width: 320, height: 844 })
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(50)
  await scrollThroughArticle(page, 1)
  await expect(progress).toHaveAttribute('aria-valuenow', '100')
})

test('article targets reconnect after client navigation and restored history', async ({ page }) => {
  await page.goto(`${article}#the-outcome-we-actually-want`)
  const progress = page.getByRole('progressbar', { name: 'Reading progress', exact: true })
  const timeOrigin = await page.evaluate(() => performance.timeOrigin)

  await expect(progress).toHaveAttribute('aria-valuenow', '100')
  await page.getByRole('link', { name: /^Next in series Code Standards/u }).click()
  await expect(page).toHaveURL(nextArticle)
  await expect(page.getByRole('heading', { level: 1, name: 'Code Standards That Scale With a Team', exact: true })).toBeVisible()
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin)
  await expect(progress).toHaveAttribute('aria-valuenow', '0')
  await scrollThroughArticle(page, 1)
  await expect(progress).toHaveAttribute('aria-valuenow', '100')
  await page.goBack()
  await expect(page).toHaveURL(`${article}#the-outcome-we-actually-want`)
  await expect(page.getByRole('heading', { level: 1, name: 'Responsive Design Standards That Scale Across Components', exact: true })).toBeVisible()
  await expect(progress).toHaveAttribute('aria-valuenow', '100')
  await scrollThroughArticle(page, 0.5)
  await expect(progress).toHaveAttribute('aria-valuenow', '50')
})

const expectDocumentProgress = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready)
  const progress = page.getByRole('progressbar', { name: 'Reading progress', exact: true })

  await page.evaluate(() => {
    scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) / 2, behavior: 'instant' })
  })
  await expect(progress).toHaveAttribute('aria-valuenow', '50')
  await expect.poll(async () => {
    await page.evaluate(() => {
      scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    })
    return progress.getAttribute('aria-valuenow')
  }).toBe('100')
}

test('projects preserve document progress', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')
  await expect(page.getByRole('progressbar', { name: 'Reading progress', exact: true })).not.toHaveAttribute('data-ui-scroll-progress-target')
  await expectDocumentProgress(page)
})

test('a missing target falls back to document progress', async ({ page }) => {
  await page.goto(article)
  await page.getByRole('progressbar', { name: 'Reading progress', exact: true }).evaluate(element => {
    element.setAttribute('data-ui-scroll-progress-target', 'missing-article')
  })
  await expectDocumentProgress(page)
  await expect(page.getByRole('progressbar', { name: 'Reading progress', exact: true })).toHaveAttribute('aria-valuenow', '100')
})
