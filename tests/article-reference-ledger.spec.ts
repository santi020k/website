import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/blog/migrate-eslint-8-or-less-to-eslint-9/'
const earlierURL = '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/'
const relatedURL = 'https://medium.com/@santi020k/building-the-best-next-js-typescript-standard-vitest-eslint-configuration-f6d91d6346e7'
const repositoryURL = 'https://github.com/santi020k/eslint-config-basic'

test.use({ reducedMotion: 'reduce' })

for (const theme of ['light', 'dark'] as const) {
  test(`series connection uses the shared ledger while the next chapter stays distinct in ${theme}`, async ({ page }) => {
    // Remote comments have separate lifecycle coverage; keep this reading-layout audit deterministic.
    await page.route('https://giscus.app/**', route => route.abort())
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto(earlierURL)
    const connection = page.getByRole('navigation', { name: 'Related reading', exact: true })
    const link = connection.getByRole('link')

    await expect(link).toHaveAttribute('href', route)
    await expect(link).not.toHaveAttribute('target')
    await expect(connection.locator('[data-reference-kind]')).toHaveText('Another series')
    await expect(connection.locator('[data-reference-source]')).toHaveText('ESLint in Practice')
    await expect(page.locator('[data-series-adjacent="next"]')).toHaveAttribute('href', '/blog/playwright-accessibility-checks-that-teams-keep-running/')
    expect(await connection.evaluate(element => {
      const conclusion = document.getElementById('conclusions')
      const continuation = document.getElementById('series-navigation')

      return conclusion && continuation &&
        Boolean(conclusion.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(element.compareDocumentPosition(continuation) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    for (const { width, size } of [{ width: 320, size: 100 }, { width: 390, size: 200 }, { width: 1440, size: 100 }]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(size => {
        document.documentElement.style.fontSize = `${size}%`
      }, size)
      expect(await link.evaluate(element => {
        const bounds = element.getBoundingClientRect()

        return bounds.height >= 44 && bounds.left >= 0 && bounds.right <= innerWidth &&
          element.scrollWidth <= element.clientWidth + 1 &&
          document.documentElement.scrollWidth <= innerWidth
      })).toBe(true)
    }
    await link.focus()
    await expect(link).toHaveCSS('outline-style', 'solid')
    await expectNoUnexpectedAccessibilityViolations(page)
    await link.press('Enter')
    await expect(page).toHaveURL(route)
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`references reflow with the introduction in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(route)
    await page.evaluate(value => {
      document.documentElement.dataset.theme = value
    }, theme)
    const ledger = page.getByRole('navigation', { name: 'References for this article' })
    const links = ledger.getByRole('link')

    await expect(links).toHaveCount(3)
    await expect(links.nth(0)).toHaveAttribute('href', relatedURL)
    await expect(links.nth(1)).toHaveAttribute('href', repositoryURL)
    await expect(links.nth(2)).toHaveAttribute('href', earlierURL)
    await expect(links.nth(0)).toHaveAttribute('target', '_blank')
    await expect(links.nth(0)).toHaveAttribute('rel', /noopener.*noreferrer/u)
    await expect(links.nth(2)).not.toHaveAttribute('target')
    await expect(page.locator('[data-article-lead]')).toContainText('I shared the ESLint base')
    await expect(page.locator('[data-article-lead]')).not.toContainText('Previous Post')
    await expect(ledger.locator('[data-reference-kind]')).toHaveText(['Related guide', 'Repository', 'Earlier article'])

    expect(await ledger.evaluate(element => {
      const lead = document.querySelector('[data-article-margin-lead]')
      const heading = document.getElementById('why-this-migration-matters')

      return lead && heading && Boolean(lead.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(element.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    for (const { width, size } of [{ width: 320, size: 100 }, { width: 390, size: 200 }, { width: 1440, size: 100 }]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(async fontSize => {
        document.documentElement.style.fontSize = `${fontSize}%`
        await document.fonts.ready
      }, size)
      expect(await links.evaluateAll(elements => elements.every(element => {
        const bounds = element.getBoundingClientRect()

        return bounds.height >= 44 && bounds.left >= 0 && bounds.right <= innerWidth &&
          element.scrollWidth <= element.clientWidth + 1
      }))).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    await links.first().focus()
    await expect(links.first()).not.toHaveCSS('outline-style', 'none')
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const slug of ['migrate-eslint-8-or-less-to-eslint-9', 'development-workflow-with-husky-for-next-js-eslint-and-vitest-integration']) {
    test(`Markdown and MDX references remain usable on ${slug}`, async ({ page }) => {
      await page.goto(`/blog/${slug}/`)
      const ledger = page.getByRole('navigation', { name: 'References for this article' })

      await expect(ledger).toBeVisible()
      await expect(ledger.getByRole('link', { name: /Repository/u })).toHaveAttribute('href', /^https:\/\/github.com\/santi020k\//u)
      await expect(page.locator('[data-article-lead]')).not.toContainText('Previous Post')
      await expect(page.locator('[data-article-lead]').getByRole('link', { name: 'GitHub Repository', exact: true })).toHaveCount(0)
    })
  }

  test('a reference link navigates normally and chapters keep their original references', async ({ page }) => {
    await page.goto(route)
    await page.getByRole('navigation', { name: 'References for this article' }).getByRole('link', { name: /Earlier article/u }).click()
    await expect(page).toHaveURL(earlierURL)
    await page.goto('/blog/atomic-module-component-structure-for-react/')
    await expect(page.locator('[data-article-references]')).toHaveCount(0)
    await expect(page.locator('[data-article-prose]').getByRole('link', { name: 'GitHub Repository', exact: true })).toHaveAttribute(
      'href', 'https://github.com/santi020k/posts/tree/post-1'
    )
  })
})
