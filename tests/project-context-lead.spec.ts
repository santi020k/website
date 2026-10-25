import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  test(`context lead keeps the authored introduction readable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/smith-commerce/#two-commerce-projects-at-smith')
    await page.evaluate(() => document.fonts.ready)
    const opening = page.getByRole('region', { name: 'Two commerce projects at Smith', exact: true })

    await expect(opening.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'two-commerce-projects-at-smith')
    await expect(opening.getByText('Work notes', { exact: true })).toBeVisible()
    await expect(opening.getByText('Active work', { exact: true })).toBeVisible()
    await expect(page.locator('[data-content-notes]')).toHaveCount(0)
    await expect(opening).toContainText('frontend systems that connect product discovery, purchasing, and account workflows with commerce APIs.')
    const company = opening.getByRole('link', { name: 'Smith Commerce', exact: true })

    await expect(company).toHaveAttribute('href', 'https://smithcommerce.com')
    await expect(company).toHaveAttribute('target', '_blank')
    await expect(company).toHaveAttribute('rel', /noopener/)
    await expect(company).toHaveAttribute('rel', /noreferrer/)
    await expect(page.locator('[data-project-chapters] a')).toHaveCount(13)

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await opening.scrollIntoViewIfNeeded()
        expect(await opening.locator('h2, p').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
    const audit = await new AxeBuilder({ page }).include('[data-project-context-lead]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('opening fragment remains reachable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto('/portfolio/smith-commerce/')
  const opener = page.locator('[data-project-mobile-toc]')

  await opener.locator('summary').click()
  await opener.getByRole('link', { name: 'Two commerce projects at Smith', exact: true }).click()
  await expect(page).toHaveURL(/#two-commerce-projects-at-smith$/)
  await expect(page.locator('#two-commerce-projects-at-smith')).toBeInViewport()
  await expect(page.locator('[data-content-notes]')).toHaveCount(0)
  await context.close()
})

test('projects without an authored context lead retain their preface', async ({ page }) => {
  await page.goto('/portfolio/lumen-ui/')
  await expect(page.locator('[data-content-notes]')).toHaveCount(1)
  await expect(page.locator('[data-project-context-lead]')).toHaveCount(0)
  await expect(page.locator('[data-notes-description]')).toContainText('A closer look')
})
