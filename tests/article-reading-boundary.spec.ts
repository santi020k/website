import { expect, type Page, test } from '@playwright/test'

const seriesArticle = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const standaloneArticle = '/blog/astro-doctor-announcement/'
const nextKeys = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
}

test.use({ reducedMotion: 'reduce' })

const reachClosing = async (page: Page) => {
  await page.locator('[data-post-continuation]').evaluate(element => {
    scrollTo({ top: element.getBoundingClientRect().top + scrollY - 128, behavior: 'instant' })
  })
}

const expectRailBeforeClosing = async (page: Page) => {
  await expect.poll(() => page.locator('[data-post-desktop-toc]').evaluate(rail => {
    const prose = document.querySelector('#article-content')
    const closing = document.querySelector('[data-post-continuation]')?.firstElementChild

    if (!prose || !closing) throw new Error('Missing article reading content')

    return rail.getBoundingClientRect().bottom <= prose.getBoundingClientRect().bottom + 1 &&
      rail.getBoundingClientRect().bottom < closing.getBoundingClientRect().top
  })).toBe(true)
}

for (const route of [seriesArticle, standaloneArticle]) {
  for (const theme of ['light', 'dark']) {
    test(`the contents rail ends with the prose on ${route} in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      const rail = page.locator('[data-post-desktop-toc]')

      await page.locator('#article-content').evaluate(element => {
        const bounds = element.getBoundingClientRect()
        scrollTo({ top: bounds.top + scrollY + bounds.height / 2, behavior: 'instant' })
      })
      await expect.poll(() => rail.evaluate(element => Math.round(element.getBoundingClientRect().top)))
        .toBe(112)
      await reachClosing(page)
      await expectRailBeforeClosing(page)
      const gap = await page.locator('[data-post-continuation]').evaluate(element => {
        const prose = document.querySelector('#article-content')?.getBoundingClientRect()
        const first = element.firstElementChild?.getBoundingClientRect()

        if (!prose || !first) throw new Error('Missing the closing flow')
        return first.top - prose.bottom
      })

      expect(gap).toBeCloseTo(route === seriesArticle ? 64 : 40, 0)
      await expect(page.getByRole('progressbar', { name: 'Reading progress', exact: true }))
        .toHaveAttribute('aria-valuenow', '100')
      expect(await page.locator('[data-post-continuation]').evaluate(element => {
        const prose = document.querySelector('#article-content')?.getBoundingClientRect()
        const bounds = element.getBoundingClientRect()

        return prose && Math.abs(bounds.left - prose.left) <= 1 && Math.abs(bounds.width - prose.width) <= 1
      })).toBe(true)
      await page.locator('#comments').evaluate(element => {
        scrollTo({ top: element.getBoundingClientRect().top + scrollY - 128, behavior: 'instant' })
      })
      await expectRailBeforeClosing(page)
      await expect(page.locator('[data-giscus-mount] script')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  }
}

for (const width of [390, 1024]) {
  test(`enlarged text keeps the chapter opener and closing flow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(seriesArticle)
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '200%'
      await document.fonts.ready
    })
    await expect(page.locator('[data-post-mobile-toc]')).toBeVisible()
    await expect(page.locator('[data-post-rail-boundary]')).toBeHidden()
    expect(await page.locator('[data-post-continuation]').evaluate(element => {
      const prose = document.querySelector('#article-content')?.getBoundingClientRect()
      const bounds = element.getBoundingClientRect()

      return prose && bounds.top >= prose.bottom && Math.abs(bounds.width - prose.width) <= 1 &&
        document.documentElement.scrollWidth <= innerWidth
    })).toBe(true)
  })
}

test('a connected series retains its compact gap before the chapter navigation', async ({ page }) => {
  await page.goto('/blog/authentication-and-authorization-in-next-js-applications-with-supabase/')
  expect(await page.locator('[data-series-connection]').evaluate(element => {
    const next = document.querySelector('#series-navigation')

    if (!next) throw new Error('Missing the current series navigation')
    const gap = next.getBoundingClientRect().top - element.getBoundingClientRect().bottom
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize)

    return Math.abs(gap - rootSize * 1.25) <= 1
  })).toBe(true)
})

test('the boundary survives article navigation and Back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(seriesArticle)
  await page.locator('#series-navigation').getByRole('link', { name: /Previous in series/u }).click()
  await expect(page).toHaveURL('/blog/authentication-and-authorization-in-next-js-applications-with-supabase/')
  await reachClosing(page)
  await expectRailBeforeClosing(page)
  await page.goBack()
  await expect(page).toHaveURL(seriesArticle)
  await reachClosing(page)
  await expectRailBeforeClosing(page)
})

test('keyboard reading continues from the contents into the closing flow', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(seriesArticle)
  const nextKey = nextKeys[browserName]

  await page.locator('[data-post-desktop-toc]').getByRole('link').last().focus()
  await page.keyboard.press(nextKey)
  await expect(page.locator('#series-navigation').getByRole('link').first()).toBeFocused()
  await page.getByRole('link', { name: 'Share on WhatsApp', exact: true }).focus()
  await page.keyboard.press(nextKey)
  await expect(page.locator('#related-writing').getByRole('link').first()).toBeFocused()
  await page.locator('[data-page-section]:has(#related-writing)').getByRole('link').last().focus()
  await page.keyboard.press(nextKey)
  await expect(page.locator('[data-article-newsletter] input[type="email"]')).toBeFocused()
  await page.locator('[data-article-newsletter] a[href="/feed.xml"]').focus()
  await page.keyboard.press(nextKey)
  await expect(page.locator('[data-post-final-return]').getByRole('link', { name: 'Back to Blog' })).toBeFocused()
})

test('the rail boundary and section links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()

  try {
    await page.goto(seriesArticle)
    await reachClosing(page)
    await expectRailBeforeClosing(page)
    await page.locator('[data-post-desktop-toc]').getByRole('link', { name: 'Run the examples locally', exact: true }).press('Enter')
    await expect(page).toHaveURL(`${seriesArticle}#run-the-examples-locally`)
    await expect(page.locator('#run-the-examples-locally')).toBeInViewport()
  } finally {
    await context.close()
  }
})
