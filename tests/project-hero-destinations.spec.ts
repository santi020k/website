import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { waitForFonts } from './helpers/rendering'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 1440]) {
    test(`destination brief remains readable at ${width}px in ${theme}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      for (const slug of ['smith-commerce', 'eslint-config-santi020k']) {
        await page.goto(`/portfolio/${slug}/`)
        await page.evaluate(() => document.fonts.ready)
        const destinations = page.getByRole('navigation', { name: 'Project destinations', exact: true })
        const links = destinations.getByRole('link')

        for (const textSize of [100, 200]) {
          await page.evaluate(size => {
            document.documentElement.style.fontSize = `${size}%`
          }, textSize)
          await destinations.scrollIntoViewIfNeeded()
          const clipped = await destinations.locator('a, p').evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent))
          const heights = await links.evaluateAll(els => els.map(el => el.getBoundingClientRect().height))

          expect(clipped).toEqual([])
          expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)
          expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
        }
        await page.evaluate(() => {
          document.documentElement.style.fontSize = ''
        })
        await links.first().focus()
        await expect(links.first()).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
        await expect(links.nth(1)).toBeFocused()
        const audit = await new AxeBuilder({ page }).include('[data-project-destinations]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

        expect(audit.violations).toEqual([])
      }
    })
  }
}

test('hero destinations retain named sites, archives, repositories, galleries, and browse routes', async ({ page }) => {
  await page.goto('/portfolio/smith-commerce/')
  const hero = page.getByRole('navigation', { name: 'Project destinations', exact: true })
  const website = hero.getByRole('link', { name: 'Visit Marcone', exact: true })

  await expect(hero.locator('[data-destination-name]')).toHaveText('Marcone')
  await expect(website).toHaveAttribute('href', 'https://www.marcone.com/')
  await expect(website).toHaveAttribute('target', '_blank')
  await expect(website).toHaveAttribute('rel', /noopener/u)
  await expect(website).toHaveAttribute('rel', /noreferrer/u)
  await expect(hero.getByRole('link', { name: 'View F.W. Webb previews' })).toHaveAttribute('href', '#inside-the-product')
  await expect(hero.getByRole('link', { name: 'Browse work' })).toHaveAttribute('href', '/work/')
  await expect(hero.getByRole('link')).toHaveCount(3)

  await page.goto('/portfolio/lumen-ui/')
  await expect(hero.getByRole('link', { name: 'Visit Lumen UI', exact: true })).toHaveAttribute('href', 'https://lumen.santi020k.com/')
  await expect(hero.getByRole('link', { name: 'Open repository' })).toHaveAttribute('href', 'https://github.com/santi020k/lumen')
  await expect(hero.getByRole('link', { name: 'View product previews' })).toHaveAttribute('href', '#inside-the-product')
  await expect(hero.getByRole('link', { name: 'Browse projects' })).toHaveAttribute('href', '/projects/')

  await page.goto('/portfolio/xgames/')
  await expect(hero.locator('[data-destination-context]')).toHaveText('Explore the archived website')
  await expect(hero.locator('[data-destination-primary]')).toHaveAttribute('href', 'https://web.archive.org/web/20250827083904/https://www.xgames.com/')
  await expect(hero.getByRole('link', { name: /previews/u })).toHaveCount(0)

  await page.goto('/portfolio/optic-power/')
  await expect(hero.getByRole('link', { name: 'Visit Codepwr', exact: true })).toHaveAttribute('href', 'https://www.codepwr.com/')

  await page.goto('/portfolio/coolstead/')
  await expect(hero.locator('[data-destination-brief]')).toHaveCount(0)
  await expect(hero.getByRole('link')).toHaveCount(1)
  await expect(hero.getByRole('link', { name: 'Browse projects' })).toHaveAttribute('href', '/projects/')
})

for (const javaScriptEnabled of [true, false]) {
  test(`the named Webb preview link reaches the gallery with JavaScript ${javaScriptEnabled}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } })
    const page = await context.newPage()

    try {
      await page.goto('/portfolio/smith-commerce/')
      await waitForFonts(page)
      const link = page.getByRole('navigation', { name: 'Project destinations' }).getByRole('link', { name: 'View F.W. Webb previews' })

      await expect(link).not.toHaveAttribute('target', '_blank')
      await link.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#inside-the-product$/u)
      await expect(page.locator('#inside-the-product')).toBeInViewport()
      await expect(page.locator('[data-product-previews]')).toContainText('F.W. Webb development preview')
    } finally {
      await context.close()
    }
  })
}
