import { expect, type Page, test } from '@playwright/test'

import { getArticlePageImprint, getArticlePrintLabel } from '../src/utils/article-page-imprint'

const guide = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const getPaginationSupport = (page: Page) => page.evaluate(() => {
  const sheet = new CSSStyleSheet()

  sheet.replaceSync('@page { @bottom-left { content: "Support probe"; } }')
  // WebKit accepts the page property but does not expose its computed value.
  const probe = document.createElement('div')

  document.body.append(probe)
  probe.style.setProperty('page', 'auto')
  const defaultPage = getComputedStyle(probe).getPropertyValue('page')

  probe.style.setProperty('page', 'article')
  const namedPage = getComputedStyle(probe).getPropertyValue('page')

  probe.remove()

  return {
    defaultPage,
    namedPage,
    marginBoxes: sheet.cssRules[0]?.cssText.includes('@bottom-left') ?? false
  }
})
test.use({ reducedMotion: 'reduce' })

test('Page imprint applies only in print', async ({ page }) => {
  await page.goto(guide)
  const title = await page.getByRole('heading', { level: 1 }).innerText()
  const support = await getPaginationSupport(page)

  await expect(page.locator('html')).toHaveCSS('page', support.defaultPage)
  await expect(page.locator('[data-article-page-imprint]')).toHaveCount(1)
  await expect(page.locator('[data-article-page-imprint]')).toHaveJSProperty('textContent', getArticlePageImprint(title))
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('html')).toHaveCSS('page', support.namedPage)
  await page.emulateMedia({ media: 'screen' })
  await expect(page.locator('html')).toHaveCSS('page', support.defaultPage)
  await expect(page.locator('[data-ui-code-copy]').first()).toBeVisible()
})

test('page-margin support provides the native imprint or a clean fallback', async ({ page }) => {
  await page.goto(guide)
  const title = await page.getByRole('heading', { level: 1 }).innerText()
  const support = await getPaginationSupport(page)
  const rules = await page.evaluate(() => Array.from(document.styleSheets).flatMap(sheet => {
    const collect = (rules: CSSRuleList): string[] => Array.from(rules).flatMap(rule => {
      if (rule instanceof CSSPageRule) return [rule.cssText]
      if (rule instanceof CSSMediaRule) return collect(rule.cssRules)

      return []
    })

    return collect(sheet.cssRules)
  }))

  expect(rules.some(rule => rule.includes('counter(page, decimal-leading-zero)') && rule.includes('counter(pages, decimal-leading-zero)'))).toBe(support.marginBoxes)
  expect(rules.some(rule => rule.includes(getArticlePrintLabel(title)))).toBe(support.marginBoxes)
})

test('client navigation replaces the running title and removes it outside articles', async ({ page }) => {
  await page.goto(guide)
  const oldTitle = await page.getByRole('heading', { level: 1 }).innerText()
  const support = await getPaginationSupport(page)

  await page.locator('#article-content a[href="/blog/astro-doctor-announcement/"]').click()
  await expect(page).toHaveURL(/\/blog\/astro-doctor-announcement\/$/u)
  const newTitle = await page.getByRole('heading', { level: 1 }).innerText()

  await expect(page.locator('[data-article-page-imprint]')).toHaveCount(1)
  await expect(page.locator('[data-article-page-imprint]')).toHaveJSProperty('textContent', getArticlePageImprint(newTitle))
  expect(await page.locator('[data-article-page-imprint]').textContent()).not.toContain(oldTitle)
  await page.locator('[data-cover-byline] a').click()
  await expect(page).toHaveURL(/\/about\/$/u)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('html')).toHaveCSS('page', support.defaultPage)
  await expect(page.locator('[data-article-page-imprint]')).toHaveCount(0)
})

test('unusual titles remain text inside one style rule', async ({ page }) => {
  const title = 'Quotes "and" \\ </style><script>document.title="injected"</script>'

  await page.setContent(`<style>${getArticlePageImprint(title)}</style><h1>Safe fixture</h1>`)
  await expect(page.getByRole('heading')).toHaveText('Safe fixture')
  await expect(page.locator('script')).toHaveCount(0)
  await expect(page.locator('style')).toHaveCount(1)
  await expect(page.locator('style')).toHaveJSProperty('textContent', getArticlePageImprint(title))
})
