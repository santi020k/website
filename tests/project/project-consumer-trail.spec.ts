import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const route = '/portfolio/lumen-ui/#used-in-this-website'

for (const theme of ['light', 'dark']) {
  test(`consumer examples reflow with visible keyboard focus in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)
    const trail = page.locator('[data-project-consumer-trail]')
    const examples = trail.getByRole('navigation', { name: 'See Lumen in use' })

    await expect(examples.getByRole('link')).toHaveCount(2)
    await expect(examples.getByRole('link').first()).toHaveAccessibleName('Travel notebook The travel notebook uses WorldMap.')
    await expect(examples.getByRole('link').last()).toHaveAccessibleName('Homepage product preview A product screenshot presented through DeviceFrame.')
    const migration = trail.getByRole('link', { name: 'v3 to v4 migration guide' })

    await expect(migration).toHaveAttribute('target', '_blank')
    await expect(migration).toHaveAttribute('rel', /noopener/)
    await expect(migration).toHaveAttribute('rel', /noreferrer/)

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await trail.scrollIntoViewIfNeeded()
        expect(await trail.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        expect(await examples.getByRole('link').evaluateAll(links => links.every(link => {
          const bounds = link.getBoundingClientRect()

          return bounds.height >= 44 && bounds.width >= 44 && link.scrollWidth <= link.clientWidth + 1
        }))).toBe(true)
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '100%'
    })
    const first = examples.getByRole('link').first()

    await first.focus()
    await page.keyboard.press('Shift')
    expect(await first.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid')
    const audit = await new AxeBuilder({ page }).include('[data-project-consumer-trail]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

for (const javaScriptEnabled of [true, false]) {
  test(`consumer links reach real examples with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()

    try {
      await page.goto(route)
      const trail = page.locator('[data-project-consumer-trail]')
      const travel = trail.getByRole('link', { name: /^Travel notebook/ })

      await expect(travel).toHaveAttribute('href', '/travel/')
      await expect(travel).not.toHaveAttribute('target', '_blank')
      await travel.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/travel\/$/)
      await expect(page.locator('[data-travel-atlas]')).toBeVisible()
      await page.goBack()
      await expect(page).toHaveURL(/\/portfolio\/lumen-ui\/#used-in-this-website$/)
      const preview = trail.getByRole('link', { name: /^Homepage product preview/ })

      await expect(preview).toHaveAttribute('href', '/#projects-heading')
      await expect(preview).not.toHaveAttribute('target', '_blank')
      await preview.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/#projects-heading$/)
      await expect(page.locator('[data-home-showcase="projects"] [data-ui-device-screen]').first()).toBeVisible()
      const heading = page.locator('#projects-heading')

      await expect(heading).toBeInViewport()
      await expect.poll(() => heading.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(80)
      expect(context.pages()).toHaveLength(1)
    } finally {
      await context.close()
    }
  })
}
