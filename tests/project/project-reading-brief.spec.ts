import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const content = path.resolve('src/content/project')
const projects = readdirSync(content).filter(id => !/^draft: true$/mu.test(readFileSync(path.join(content, id, 'index.mdx'), 'utf8')))
const sectionLabels = (count: number) => count ? [`${count} ${count === 1 ? 'section' : 'sections'}`] : []

test('every published project has one reading brief below its original opening heading without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  try {
    for (const id of projects) {
      await page.goto(`/portfolio/${id}/`)
      const opening = page.locator('[data-project-context-lead]')
      const brief = opening.locator('[data-project-reading-brief]')
      await expect(brief).toHaveCount(1)
      await expect(brief.locator('dd').first()).toHaveText(/^About [1-9]\d* minutes?$/u)
      const sections = await page.locator('.prose-project h2, .prose-project h3').evaluateAll(elements => elements.filter(element => !element.closest('dialog, template')).length) - 1
      expect((await brief.locator('dd').allTextContents()).slice(1)).toEqual(sectionLabels(sections))
      const order = await opening.evaluate(el => {
        const heading = el.querySelector('h2')
        const summary = el.querySelector('[data-project-reading-brief]')
        return heading?.nextElementSibling === summary && summary?.nextElementSibling?.tagName === 'P'
      })
      expect(order).toBe(true)
    }
  } finally {
    await context.close()
  }
})

test('reading briefs remain readable in both themes at mobile and desktop sizes', async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const id of ['postlens', 'smith-commerce', 'lumen-ui']) {
      await page.goto(`/portfolio/${id}/`)
      await expect(page.locator('[data-project-reading-brief]')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
      expect(overflow).toBe(false)
      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => {
          document.documentElement.dataset.theme = `santi020k-${value}`
        }, theme)
        const result = await new AxeBuilder({ page }).include('[data-project-context-lead]').analyze()
        expect(result.violations).toEqual([])
      }
    }
  }
})
