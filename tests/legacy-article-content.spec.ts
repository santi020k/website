import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const TABLE_ARTICLE = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'
const ROADMAP_ARTICLE = '/blog/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library/'

for (const width of [390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`older article content reflows at ${width}px with ${textSize}% text in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        await page.addInitScript(({ textSize, theme }) => {
          localStorage.setItem('theme', theme)
          document.addEventListener('DOMContentLoaded', () => {
            const html = document.querySelector('html')

            if (html) html.style.fontSize = `${textSize}%`
          })
        }, { textSize, theme })
        await page.goto(TABLE_ARTICLE)
        await page.evaluate(() => document.fonts.ready)

        const region = page.getByRole('region', { name: 'Table 1: How to measure developer experience' })
        const table = region.getByRole('table')

        await expect(table.getByRole('columnheader')).toHaveText([
          'Metric', 'What it measures', 'Example source', 'Review frequency'
        ])
        await expect(table.getByRole('row')).toHaveCount(6)
        await region.focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        await expect(region).toBeFocused()

        const geometry = await region.evaluate(node => ({
          width: node.clientWidth,
          cellWidths: [...node.querySelectorAll('td')].map(cell => cell.getBoundingClientRect().width),
          outlineStyle: getComputedStyle(node).outlineStyle
        }))

        // A reader can view each complete prose cell without panning within it.
        expect(Math.max(...geometry.cellWidths)).toBeLessThanOrEqual(geometry.width)
        expect(geometry.outlineStyle).toBe('solid')

        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        const tableScan = await new AxeBuilder({ page }).include('[data-prose-table]').analyze()

        expect(tableScan.violations).toEqual([])

        await page.goto(ROADMAP_ARTICLE)
        const roadmap = page.locator('#future-development + p + ul')

        await expect(roadmap).toHaveRole('list')
        await expect(roadmap.getByRole('listitem')).toHaveCount(3)
        await expect(roadmap.locator('input')).toHaveCount(0)
        await expect(roadmap).toContainText('Support for additional frameworks')
        await roadmap.scrollIntoViewIfNeeded()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        const roadmapScan = await new AxeBuilder({ page }).include('#future-development + p + ul').analyze()

        expect(roadmapScan.violations).toEqual([])
      })
    }
  }
}

test('older instructional screenshots expose their information as text alternatives', async ({ page }) => {
  await page.goto('/blog/atomic-module-component-structure-for-react/')
  const folder = page.getByRole('img', { name: /components\/atoms\/button.*button\.module\.css.*button\.test\.tsx.*button\.tsx.*button\.types\.ts/u })

  await expect(folder).toHaveCount(1)
  await page.goto('/blog/storybook-in-action-with-next-js-tailwind-and-typescript/')
  const storybook = page.getByRole('img', { name: /Storybook.*Primary Button.*onClick.*label.*variation.*size/u })

  await expect(storybook).toHaveCount(1)
})

test('article table fits the desktop reading column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(TABLE_ARTICLE)
  const region = page.locator('[data-prose-table]')
  const geometry = await region.evaluate(node => ({ width: node.clientWidth, scrollWidth: node.scrollWidth }))

  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1)
})

test('enlarged mobile table keeps native keyboard scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(TABLE_ARTICLE)
  await page.addStyleTag({ content: 'html { font-size: 200% }' })
  const region = page.locator('[data-prose-table]')

  await region.focus()
  await page.keyboard.press('ArrowRight', { delay: 100 })
  await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeGreaterThan(0)
})
