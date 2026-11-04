import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const references = [
  { name: 'Native compatibility matrix', href: 'https://github.com/santi020k/lumen/blob/main/docs/native-compatibility.md' },
  { name: 'Device validation record', href: 'https://github.com/santi020k/lumen/blob/main/docs/native-device-validation.md' }
]

for (const theme of ['light', 'dark']) {
  test(`Lumen evidence references remain readable and keyboard accessible in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/lumen-ui/#compatibility-validation')
    await page.evaluate(() => document.fonts.ready)
    const brief = page.getByRole('region', { name: 'Compatibility & validation', exact: true })
    const links = brief.getByRole('link')

    await expect(brief).toContainText('their component coverage and supported toolchains are qualified per adapter')
    await expect(brief).toContainText('A local build, a published package, a store build, and physical-device accessibility are separate evidence.')
    await expect(links).toHaveCount(2)
    await expect(page.locator('[data-project-desktop-toc] [data-reading-contents] a')).toHaveCount(8)
    for (const reference of references) {
      const link = brief.getByRole('link', { name: new RegExp(`^${reference.name}`, 'u') })

      await expect(link).toHaveAttribute('href', reference.href)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/u)
      await expect(link).toHaveAttribute('rel', /noreferrer/u)
      await expect(link).toHaveAccessibleName((await link.innerText()).replace(/\s+/gu, ' ').trim())
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await brief.scrollIntoViewIfNeeded()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        expect(await brief.locator('p, strong, [data-evidence-description]').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
        const targets = await links.evaluateAll(elements => elements.map(element => {
          const { top, bottom, left, right, height } = element.getBoundingClientRect()

          return { top, bottom, left, right, height }
        }))

        expect(targets.every(target => target.height >= 44)).toBe(true)
        const unobstructedTargets = targets.every((target, index) => {
          const earlierTargets = targets.slice(0, index)

          return earlierTargets.every(previous => target.top >= previous.bottom || target.left >= previous.right)
        })

        expect(unobstructedTargets).toBe(true)
      }
    }
    await links.first().focus()
    await expect(links.first()).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(links.last()).toBeFocused()
    await expect(links.last()).toHaveCSS('outline-style', 'solid')
    const audit = await new AxeBuilder({ page }).include('[data-project-evidence-brief]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).options({ rules: { 'label-content-name-mismatch': { enabled: true } } }).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('Lumen evidence destinations open without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 844 }
  })

  await context.route('https://github.com/santi020k/lumen/**', route => route.fulfill({ contentType: 'text/plain', body: 'Reference destination' }))
  const page = await context.newPage()

  await page.goto('/portfolio/lumen-ui/#compatibility-validation')
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded')
  const brief = page.getByRole('region', { name: 'Compatibility & validation', exact: true })

  for (const reference of references) {
    const destination = page.waitForEvent('popup')

    await brief.getByRole('link', { name: new RegExp(`^${reference.name}`, 'u') }).focus()
    await page.keyboard.press('Enter')
    const popup = await destination

    await expect(popup).toHaveURL(reference.href)
    await popup.close()
  }
  await context.close()
})
