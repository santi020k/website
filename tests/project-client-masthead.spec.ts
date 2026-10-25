import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const route = '/portfolio/smith-commerce/'
const chapters = [
  { id: 'marcone-rebuilding-for-a-headless-future', title: 'Marcone: rebuilding for a headless future', sequence: '01' },
  { id: 'fw-webb-building-the-purchasing-experience', title: 'F.W. Webb: building the purchasing experience', sequence: '02' }
]

for (const theme of ['light', 'dark']) {
  test(`client mastheads preserve readable headings and chapter links in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        for (const chapter of chapters) {
          const heading = page.locator(`#${chapter.id}`)
          const masthead = page.locator('[data-client-masthead]').filter({ has: heading })

          await expect(heading).toHaveCount(1)
          await expect(heading).toHaveText(chapter.title)
          await expect(heading).toHaveRole('heading')
          await expect(masthead.getByText(`Client project ${chapter.sequence}`, { exact: true })).toBeVisible()
          await expect(page.locator(`[data-project-chapters] a[href="#${chapter.id}"]`)).toHaveCount(1)
          expect(await masthead.locator('h2, p, [data-client-name], [data-client-subtitle]').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
    const audit = await new AxeBuilder({ page }).include('[data-client-masthead]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

for (const javaScriptEnabled of [true, false]) {
  test(`client chapter links preserve native navigation with JavaScript ${javaScriptEnabled}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()

    try {
      await page.goto(route)
      for (const chapter of chapters) {
        const group = page.locator('[data-project-chapters] details').filter({ has: page.locator(`a[href="#${chapter.id}"]`) })
        const summary = group.locator('summary')

        await summary.focus()
        await page.keyboard.press('Enter')
        const link = group.locator(`a[href="#${chapter.id}"]`)

        await expect(link).toBeVisible()
        await link.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(`${route}#${chapter.id}`)
        await expect(page.locator(`#${chapter.id}`)).toBeInViewport()
        await expect(page.locator('[data-client-masthead]').filter({ has: page.locator(`#${chapter.id}`) }).locator('[data-client-sequence]')).toBeInViewport()
      }
    } finally {
      await context.close()
    }
  })
}
