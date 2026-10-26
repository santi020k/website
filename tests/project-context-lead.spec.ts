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
    await expect(page.locator('[data-project-desktop-toc] [data-reading-contents] a')).toHaveCount(13)

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

  for (const { project, heading, fragment } of [
    { project: 'smith-commerce', heading: 'Two commerce projects at Smith', fragment: 'two-commerce-projects-at-smith' },
    { project: 'lumen-ui', heading: 'A shared language for web and native interfaces', fragment: 'a-shared-language-for-web-and-native-interfaces' }
  ]) {
    await page.goto(`/portfolio/${project}/`)
    const opener = page.locator('[data-project-mobile-toc]')

    await opener.locator('[data-toc-summary]').click()
    await opener.locator(`a[href="#${fragment}"]`).click()
    await expect(page).toHaveURL(new RegExp(`#${fragment}$`, 'u'))
    await expect(page.locator(`#${fragment}`)).toBeInViewport()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeInViewport()
    await expect(page.locator('[data-content-notes]')).toHaveCount(0)
  }
  await context.close()
})

test('projects without an authored context lead retain their preface', async ({ page }) => {
  await page.goto('/portfolio/postlens/')
  await expect(page.locator('[data-content-notes]')).toHaveCount(1)
  await expect(page.locator('[data-project-context-lead]')).toHaveCount(0)
  await expect(page.locator('[data-notes-description]')).toContainText('A closer look')
})

for (const theme of ['light', 'dark']) {
  test(`Lumen context lead preserves both opening paragraphs in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/lumen-ui/#a-shared-language-for-web-and-native-interfaces')
    await page.evaluate(() => document.fonts.ready)
    const opening = page.getByRole('region', { name: 'A shared language for web and native interfaces', exact: true })
    const paragraphs = opening.locator(':scope > p')

    await expect(opening.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'a-shared-language-for-web-and-native-interfaces')
    await expect(opening.getByText('Project notes', { exact: true })).toBeVisible()
    await expect(opening.getByText('Active project', { exact: true })).toBeVisible()
    await expect(page.locator('[data-content-notes]')).toHaveCount(0)
    await expect(paragraphs).toHaveCount(2)
    await expect(paragraphs.first()).toContainText('React Native, SwiftUI, and Jetpack Compose extend the foundations into native interfaces.')
    await expect(paragraphs.last()).toContainText('Applications keep their business rules, data, routing, and recovery policy.')
    const chapterLinks = page.locator('[data-project-desktop-toc] [data-reading-contents] a')

    await expect(chapterLinks).toHaveCount(8)
    await expect(chapterLinks.filter({ hasText: /^Outcomes$/u })).toHaveAttribute('href', '#outcomes')

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await opening.scrollIntoViewIfNeeded()
        expect(await opening.locator('h2, p').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        const separated = await paragraphs.evaluateAll(elements => elements.every((element, index) => {
          const previous = elements[index - 1]

          return !previous || element.getBoundingClientRect().top > previous.getBoundingClientRect().bottom
        }))

        expect(separated).toBe(true)
      }
    }
    const audit = await new AxeBuilder({ page }).include('[data-project-context-lead]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}
