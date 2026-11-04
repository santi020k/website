import { expect, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const locales = [{ locale: 'en', prefix: '' }, { locale: 'es', prefix: '/es' }]

for (const { locale, prefix } of locales) {
  test(`inline browse labels stay beside their arrows in ${locale}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const route of [article, '/developer-experience/', '/portfolio/smith-commerce/']) {
      await page.goto(`${prefix}${route}`)
      const links = page.locator('main a.btn-inline:has(.site-action-arrow)')
      expect(await links.count()).toBeGreaterThan(0)

      for (const width of [320, 390, 800, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        for (const size of ['100%', '200%']) {
          await page.evaluate(async value => {
            document.documentElement.style.fontSize = value
            await document.fonts.ready
          }, size)
          const misaligned = await links.evaluateAll(elements => elements.filter(element => {
            const label = element.querySelector('[data-text-link-label]')?.getBoundingClientRect()
            const arrow = element.querySelector('.site-action-arrow')?.getBoundingClientRect()
            const bounds = element.getBoundingClientRect()
            if (!label || !arrow) return true
            return element.scrollWidth > element.clientWidth + 1 || label.left < bounds.left - 1 ||
              label.right > bounds.right + 1 || (arrow.width > 0 && (
              arrow.left < label.right - 1 || arrow.right > bounds.right + 1 ||
              Math.abs(arrow.top + arrow.height / 2 - label.top - label.height / 2) > 1
            ))
          }).map(element => element.textContent.trim()))
          expect(misaligned, `${route} at ${width}px and ${size} text`).toEqual([])
        }
      }
    }
  })
}

test('inline links keep their zero horizontal padding in narrow action groups', async ({ page }) => {
  await page.goto(article)
  const link = page.locator('[data-series-footer] a.btn-inline')
  await link.evaluate(element => {
    const group = document.createElement('div')
    group.className = 'section-actions'
    group.style.width = '16rem'
    element.before(group)
    group.append(element)
  })
  await expect(link).toHaveCSS('padding-left', '0px')
  await expect(link).toHaveCSS('padding-right', '0px')
})

test.describe('Inline browse link pointer feedback', () => {
  test.use({ isMobile: false, hasTouch: false })

  for (const theme of ['light', 'dark'] as const) {
    test(`inline browse links preserve hover, focus and reduced motion in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto(`/es${article}`)
      const link = page.locator('#related-writing a.btn-inline')
      const label = link.locator('[data-text-link-label]')
      const arrow = link.locator('[data-arrow-exchange]')
      const track = arrow.locator('[data-arrow-track]')
      await link.scrollIntoViewIfNeeded()
      const before = await link.boundingBox()

      await link.hover()
      await expect(label).toHaveCSS('background-size', '100% 1px')
      await expect(track).toHaveCSS('animation-duration', '0.48s')
      expect(await link.boundingBox()).toEqual(before)
      await expect(arrow).toHaveAttribute('data-arrow-exchange', 'right')
      await expect(arrow).toHaveAttribute('aria-hidden', 'true')
      await link.focus()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(label).toHaveCSS('transition-property', 'none')
      await expect(track).toHaveCSS('animation-name', 'none')
    })
  }
})

test.describe('Inline browse links without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const { locale, prefix } of locales) {
    test(`the ${locale} browse link keeps its native destination`, async ({ page }) => {
      await page.goto(`${prefix}${article}`)
      const link = page.locator('#related-writing a.btn-inline')
      await expect(link).toHaveAttribute('href', `${prefix}/developer-experience/`)
      await link.press('Enter')
      await expect(page).toHaveURL(`${prefix}/developer-experience/`)
    })
  }
})
