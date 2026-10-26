import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { getPostPath } from '../src/utils/links'

const content = path.resolve('src/content/project')
const curated = readdirSync(content).flatMap(id => {
  const body = readFileSync(path.join(content, id, 'index.mdx'), 'utf8')
  const references = [...body.matchAll(/^ {2}- post: "([^"]+)"$/gmu)].map(match => match[1] ?? '')

  return references.length && !/^draft: true$/mu.test(body) ? [{ id, references }] : []
})

test('all curated projects link to their selected published writing without empty filler', async ({ page, request }) => {
  expect(curated.length).toBeGreaterThanOrEqual(14)
  for (const { id, references } of curated) {
    await page.goto(`/portfolio/${id}/`)
    const writing = page.locator('[data-project-story-pair]')

    await expect(writing).toHaveCount(1)
    const links = writing.getByRole('link')

    await expect(links).toHaveCount(references.length)
    for (const [index, reference] of references.entries()) {
      const destination = getPostPath(reference)

      await expect(links.nth(index)).toHaveAttribute('href', destination)
      expect((await request.get(destination)).ok()).toBe(true)
    }
  }
  await page.goto('/portfolio/smith-commerce/')
  await expect(page.locator('[data-project-story-pair]')).toHaveCount(0)
})

test('Story pair aligns content rows and remains readable and keyboard usable when stacked', async ({ page }) => {
  for (const { width, axis } of [{ width: 390, axis: 'x' }, { width: 1440, axis: 'y' }] as const) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/portfolio/postlens/#project-writing-heading')
    const writing = page.locator('[data-project-story-pair]')

    await writing.scrollIntoViewIfNeeded()
    for (const selector of ['[data-writing-label]', 'h3', '[data-writing-description]', '[data-writing-link]']) {
      const boxes = await writing.locator(selector).evaluateAll(elements => elements.map(element => {
        const { x, y } = element.getBoundingClientRect()

        return { x, y }
      }))

      expect(boxes).toHaveLength(2)
      const delta = (boxes[1]?.[axis] ?? 0) - (boxes[0]?.[axis] ?? 0)

      expect(Math.abs(delta)).toBeLessThanOrEqual(1)
    }
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)
      const result = await new AxeBuilder({ page }).include('[data-project-story-pair]').analyze()

      expect(result.violations).toEqual([])
    }
    await page.keyboard.press('Tab')
    await writing.getByRole('link').first().focus()
    await expect(writing.getByRole('link').first()).not.toHaveCSS('outline-style', 'none')
    await writing.getByRole('link').first().press('Enter')
    await expect(page).toHaveURL(/\/blog\/postlens-2-is-live\/$/u)
  }
})
