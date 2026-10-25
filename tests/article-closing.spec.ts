import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const article = '/blog/responsive-design-standards-that-scale-across-components/'

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`reader colophon preserves its destinations at ${width}px, ${textSize}% text, ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme })
        await page.route('https://giscus.app/**', route => route.abort())
        await page.goto(article)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const closing = page.locator('[data-article-closing]')
        const reply = closing.getByRole('link', { name: 'Reply on GitHub' })
        const copy = closing.getByRole('button', { name: 'Copy link', exact: true })
        const navigation = closing.getByRole('navigation', { name: 'Page-end navigation' })

        await closing.scrollIntoViewIfNeeded()
        await expect(closing.getByRole('heading', { name: 'Comments', exact: true })).toBeVisible()
        await expect(closing.getByRole('heading', { name: 'Share', exact: true })).toBeVisible()
        await expect(reply).toHaveAttribute('href', 'https://github.com/santi020k/website/discussions')
        await expect(closing.locator('[data-giscus-mount]')).toBeHidden()
        await expect(closing.locator('[data-giscus-error]')).toContainText('You can still reply on GitHub')
        await expect(navigation.getByRole('link', { name: 'Back to Blog' })).toHaveAttribute('href', '/blog/')
        await expect(navigation.getByRole('link', { name: 'Back to top' })).toHaveAttribute('href', '#main')
        for (const platform of ['LinkedIn', 'X', 'WhatsApp']) {
          const link = closing.getByRole('link', { name: `Share on ${platform}`, exact: true })

          await expect(link).toHaveAttribute('target', '_blank')
          await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        }
        expect(await closing.evaluate(element => {
          const comments = element.querySelector('#comments')?.getBoundingClientRect()
          const sharing = element.querySelector('[data-share-card]')?.getBoundingClientRect()
          const navigation = element.querySelector('[data-reading-actions]')?.getBoundingClientRect()

          if (!comments || !sharing || !navigation) throw new Error('Expected all closing sections')
          return comments.bottom <= sharing.top && sharing.bottom <= navigation.top &&
            document.documentElement.scrollWidth <= innerWidth &&
            [...element.querySelectorAll('a, button')].every(control => {
              const bounds = control.getBoundingClientRect()

              return bounds.left >= 0 && bounds.right <= innerWidth && bounds.height >= 44 &&
                control.scrollWidth <= control.clientWidth + 1
            })
        })).toBe(true)
        await page.keyboard.press('Tab')
        await reply.focus()
        await expect(reply).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press('Tab')
        await expect(copy).toBeFocused()
        await expect(copy).toHaveCSS('outline-style', 'solid')
        const scan = await new AxeBuilder({ page }).include('[data-article-closing]').analyze()

        expect(scan.violations).toEqual([])
        await navigation.getByRole('link', { name: 'Back to Blog' }).click()
        await expect(page).toHaveURL('/blog/')
      })
    }
  }
}

test('the colophon keeps native destinations and no empty widget space without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(article)
  const closing = page.locator('[data-article-closing]')

  await expect(closing.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(0)
  await expect(closing.getByRole('link')).toHaveCount(6)
  expect(await closing.locator('[data-giscus-mount]').evaluate(element => element.getBoundingClientRect().height)).toBe(0)
  await closing.getByRole('link', { name: 'Back to top' }).click()
  await expect(page).toHaveURL(/#main$/u)
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  await context.close()
})

test('project closing sections retain Dispatch sleeve and Return folio', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')
  const closing = page.locator('[data-project-closing]')

  await expect(closing.getByRole('heading', { name: 'Share this piece' })).toBeVisible()
  await expect(closing.locator('[data-share-card]')).toHaveCSS('border-top-width', '1px')
  await expect(closing.locator('[data-return-folio]')).toHaveCSS('border-top-width', '1px')
  await expect(page.locator('[data-article-closing]')).toHaveCount(0)
})
