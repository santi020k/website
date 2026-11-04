import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  test(`named return wraps and remains accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const slug of ['smith-commerce', 'lumen-ui', 'eslint-config-santi020k']) {
        await page.goto(`/portfolio/${slug}/`)
        await page.evaluate(() => document.fonts.ready)
        const nav = page.getByRole('navigation', { name: 'Page-end navigation', exact: true })

        for (const size of [100, 200]) {
          await page.evaluate(value => {
            document.documentElement.style.fontSize = `${value}%`
          }, size)
          await nav.scrollIntoViewIfNeeded()
          const links = await nav.locator('a').evaluateAll(elements => elements.map(element => ({
            height: element.getBoundingClientRect().height,
            clipped: element.scrollWidth > element.clientWidth + 1
          })))

          expect(links.every(link => link.height >= 44 && !link.clipped)).toBe(true)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        }
        await nav.getByRole('link').first().focus()
        await expect(nav.getByRole('link').first()).toHaveCSS('outline-style', 'solid')
        const audit = await new AxeBuilder({ page }).include('#project-return').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

        expect(audit.violations).toEqual([])
      }
    }
  })
}

test('closing website names and URLs match the hero, with appropriate gallery and repository links', async ({ page }) => {
  for (const slug of ['smith-commerce', 'lumen-ui', 'optic-power', 'xgames']) {
    await page.goto(`/portfolio/${slug}/`)
    const nav = page.getByRole('navigation', { name: 'Page-end navigation', exact: true })
    const hero = page.locator('[data-destination-primary]')
    const label = (await hero.innerText()).trim()
    const link = nav.getByRole('link', { name: label, exact: true })

    await expect(link).toHaveAttribute('href', await hero.getAttribute('href') ?? '')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/u)
    await expect(link).toHaveAttribute('rel', /noreferrer/u)
  }
  const nav = page.getByRole('navigation', { name: 'Page-end navigation', exact: true })

  await expect(nav.getByRole('link', { name: /previews/u })).toHaveCount(0)
  await page.goto('/portfolio/lumen-ui/')
  await expect(nav.getByRole('link', { name: 'Open repository', exact: true })).toHaveAttribute('href', 'https://github.com/santi020k/lumen')
  await expect(nav.getByRole('link', { name: 'View product previews', exact: true })).toHaveAttribute('href', '#inside-the-product')
  await page.goto('/portfolio/coolstead/')
  await expect(page.locator('#project-return [data-return-destinations]')).toHaveCount(0)
  await expect(page.locator('#project-return').getByRole('link')).toHaveCount(2)
  await page.goto('/blog/open-sourcing-santi020k-auth-cloudflare/')
  await expect(nav.getByRole('link', { name: 'Back to Blog', exact: true })).toHaveAttribute('href', '/blog/')
  await expect(nav.getByRole('link')).toHaveCount(2)
})

test('Lumen collects its closing resources once after sharing', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')
  const closing = page.locator('[data-project-closing]')
  const nav = closing.getByRole('navigation', { name: 'Page-end navigation', exact: true })
  const resources = nav.locator('[data-return-destinations] a')

  await expect(resources).toHaveText(['Visit Lumen UI', 'Try the playgrounds', 'View product previews', 'Open repository'])
  await expect(nav.getByRole('link')).toHaveCount(6)
  await expect(nav.getByRole('link', { name: 'Try the playgrounds', exact: true })).toHaveAttribute('href', 'https://lumen.santi020k.com/#playgrounds')
  await expect(nav.getByRole('link', { name: 'Try the playgrounds', exact: true })).toHaveAttribute('target', '_blank')
  await expect(nav.getByRole('link', { name: 'Try the playgrounds', exact: true })).toHaveAttribute('rel', /noopener noreferrer/u)
  await expect(page.locator('.prose-project p').last()).toContainText('instead of inventing an API')
  await expect(page.locator('.prose-project a[href="https://lumen.santi020k.com/"]')).toHaveCount(0)
  await expect(page.locator('.prose-project a[href="https://lumen.santi020k.com/#playgrounds"]')).toHaveCount(0)
  await expect(page.locator('.prose-project a[href="https://github.com/santi020k/lumen"]')).toHaveCount(0)
  await expect(closing.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(1)
  await expect(page.locator('[data-return-unified]')).toHaveCount(1)
  await page.goto('/portfolio/smith-commerce/')
  await expect(page.locator('[data-return-unified]')).toHaveCount(0)
})

for (const javaScriptEnabled of [true, false]) {
  test(`Lumen unified return supports native navigation with JavaScript ${javaScriptEnabled}`, async ({ browser, browserName }) => {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } })

    await context.route('https://lumen.santi020k.com/**', route => route.fulfill({ contentType: 'text/plain', body: 'Lumen destination' }))
    const page = await context.newPage()

    try {
      await page.goto('/portfolio/lumen-ui/#project-return')
      await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded')
      const nav = page.getByRole('navigation', { name: 'Page-end navigation', exact: true })
      const site = nav.getByRole('link', { name: 'Visit Lumen UI', exact: true })
      const playground = nav.getByRole('link', { name: 'Try the playgrounds', exact: true })
      const gallery = nav.getByRole('link', { name: 'View product previews', exact: true })

      await site.focus()
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(playground).toBeFocused()
      await expect(playground).toHaveCSS('outline-style', 'solid')
      const destination = page.waitForEvent('popup')

      await page.keyboard.press('Enter')
      const popup = await destination

      await expect(popup).toHaveURL('https://lumen.santi020k.com/#playgrounds')
      await popup.close()
      await gallery.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#inside-the-product$/u)
      await expect(page.locator('#inside-the-product')).toBeInViewport()
      await nav.getByRole('link', { name: 'Back to Projects', exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/projects\/$/u)
    } finally {
      await context.close()
    }
  })
}

for (const javaScriptEnabled of [true, false]) {
  test(`closing preview link returns to Webb with JavaScript ${javaScriptEnabled}`, async ({ browser, browserName }) => {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } })
    const page = await context.newPage()

    try {
      await page.goto('/portfolio/smith-commerce/')
      const nav = page.getByRole('navigation', { name: 'Page-end navigation', exact: true })
      const site = nav.getByRole('link', { name: 'Visit Marcone', exact: true })
      const gallery = nav.getByRole('link', { name: 'View F.W. Webb previews', exact: true })

      await site.focus()
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(gallery).toBeFocused()
      await expect(gallery).not.toHaveAttribute('target', '_blank')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#inside-the-product$/u)
      await expect(page.locator('#inside-the-product')).toBeInViewport()
    } finally {
      await context.close()
    }
  })
}
