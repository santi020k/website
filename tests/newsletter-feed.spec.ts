import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const canonicalFeed = 'https://santi020k.com/feed.xml'
const copy = '[data-newsletter-copy]'
const stubClipboard = async (page: Page, outcome: 'success' | 'failure' | 'missing' = 'success') => {
  await page.addInitScript(result => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: result === 'missing' ?
        undefined :
        {
          writeText: (text: string) => {
            if (result === 'failure') return Promise.reject(new DOMException('Denied for test', 'NotAllowedError'))
            localStorage.setItem('newsletter-copied-feed', text)
            localStorage.setItem('newsletter-copy-count', String(Number(localStorage.getItem('newsletter-copy-count') ?? 0) + 1))
            return Promise.resolve()
          }
        }
    })
  }, outcome)
}

test.use({ reducedMotion: 'reduce' })

for (const locale of ['en', 'es']) {
  const prefix = locale === 'es' ? '/es' : ''
  const idle = locale === 'es' ? 'Copiar feed' : 'Copy feed'
  const success = locale === 'es' ? '¡Copiado! Dirección del feed RSS copiada' : 'Copied! RSS feed address copied'
  const rss = locale === 'es' ? 'Feed RSS' : 'RSS feed'

  for (const route of ['/blog/', article]) {
    test(`${locale} ${route} copies the canonical feed and restores its localized label`, async ({ page }) => {
      await stubClipboard(page)
      await page.clock.install()
      await page.goto(`${prefix}${route}?utm_source=feed-test#newsletter`)
      const button = page.locator(copy)
      const status = page.locator('[data-newsletter-footer] [role="status"]')
      await expect(button).toHaveAccessibleName(idle)
      await expect(page.getByRole('link', { name: rss, exact: true })).toHaveAttribute('href', '/feed.xml')
      await button.scrollIntoViewIfNeeded()
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
      await button.focus()
      await button.press('Enter')
      await expect(button).toHaveAccessibleName(success)
      await expect(button).toBeFocused()
      await expect.poll(() => page.evaluate(() => localStorage.getItem('newsletter-copied-feed'))).toBe(canonicalFeed)
      await expect(status).toHaveAttribute('aria-live', 'polite')
      await expect(status).toHaveAttribute('aria-atomic', 'true')
      await page.clock.runFor(100)
      await expect(status).toHaveText(success)
      await page.clock.runFor(1900)
      await expect(button).toHaveAccessibleName(idle)
      await expect(status).toBeEmpty()
      await expect(button).toBeFocused()
    })
  }

  for (const outcome of ['failure', 'missing'] as const) {
    test(`${locale} ${outcome} clipboard keeps the feed selectable and permits retry`, async ({ page, browserName }) => {
      await stubClipboard(page, outcome)
      await page.goto(`${prefix}${article}`)
      await page.setViewportSize({ width: 320, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      const button = page.locator(copy)
      const recovery = page.locator('[data-newsletter-footer] [data-link-recovery]')
      await button.focus()
      await button.press('Enter')
      await expect(button).toBeFocused()
      await expect(button).toHaveAccessibleName(locale === 'es' ? 'Intentar de nuevo' : 'Try again')
      await expect(recovery).toBeVisible()
      await expect(recovery.locator('textarea')).toHaveValue(canonicalFeed)
      await expect(recovery.locator('label')).toHaveText(locale === 'es' ? 'Selecciona y copia la dirección del feed.' : 'Select and copy the feed address.')
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(recovery.locator('textarea')).toBeFocused()
      await expect.poll(() => recovery.locator('textarea').evaluate(field => {
        if (!(field instanceof HTMLTextAreaElement)) throw new Error('Expected the feed address textarea')
        return field.selectionEnd - field.selectionStart
      })).toBe(canonicalFeed.length)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true,
          value: { writeText: (text: string) => {
            localStorage.setItem('newsletter-copied-feed', text)
            return Promise.resolve()
          } } })
      })
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab')
      await expect(button).toBeFocused()
      await button.press('Space')
      await expect(button).toHaveAccessibleName(success)
      await expect(recovery).toBeHidden()
      await expect(button).toBeFocused()
      await expect.poll(() => page.evaluate(() => localStorage.getItem('newsletter-copied-feed'))).toBe(canonicalFeed)
    })
  }
}

test('feed copying survives route swaps without changing article sharing', async ({ page }) => {
  await stubClipboard(page)
  await page.goto(article)
  await page.locator(copy).click()
  await expect(page.locator('#copy-link-btn')).toHaveAccessibleName('Copy link')
  await expect(page.locator('#article-copy-link')).toHaveAccessibleName('Copy link to article')
  await expect(page.locator('#copy-status')).toBeEmpty()
  await page.locator('[data-return-link]').click()
  await expect(page).toHaveURL('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await page.locator(copy).click()
  await expect(page.locator('#newsletter-feed-copy-compact')).toHaveAccessibleName('Copied! RSS feed address copied')
  await page.goBack()
  await expect(page).toHaveURL(article)
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await page.locator('#newsletter-feed-copy-article').click()
  await expect(page.locator('#newsletter-feed-copy-article')).toHaveAccessibleName('Copied! RSS feed address copied')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('newsletter-copy-count'))).toBe('3')
})

test('the feed utility reflows in both themes and has no detected card accessibility violations', async ({ page }) => {
  await stubClipboard(page, 'failure')
  await page.goto('/es/blog/')
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => {
      document.documentElement.dataset.theme = value
    }, theme)
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of ['100%', '200%']) {
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = value
          await document.fonts.ready
        }, size)
        await page.locator(copy).click()
        await expect(page.locator('[data-newsletter-footer] textarea')).toBeVisible()
        await page.locator('[data-newsletter-rss]').click({ trial: true })
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
    const audit = await new AxeBuilder({ page }).include('[data-newsletter]').analyze()
    expect(audit.violations).toEqual([])
  }
})

test.describe('Newsletter feed without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const prefix of ['', '/es']) {
    test(`the native RSS destination and signup remain available on ${prefix || 'English'} pages`, async ({ page }) => {
      await page.goto(`${prefix}${article}`)
      await expect(page.locator(copy)).toBeHidden()
      await expect(page.locator('[data-newsletter-form]')).toHaveAttribute('method', 'post')
      const rss = page.locator('[data-newsletter-rss]')
      await expect(rss).toBeVisible()
      await rss.click()
      await expect(page).toHaveURL('/feed.xml')
    })
  }
})
