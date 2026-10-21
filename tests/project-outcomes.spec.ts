import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const smithOutcomes = [
  'Lighthouse score improved from 35 to 98',
  'Time to Interactive dropped by 75%',
  '100% accessibility score on the rebuilt storefront'
]
const lumenOutcomes = [
  'Connects web and native interfaces through shared tokens and explicit component contracts',
  'Combines accessible controls, charts, maps, and operational layouts with platform-native authoring',
  'Supports design and AI workflows through Figma resources, an agent skill, MCP, and a machine-readable registry'
]

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 1440]) {
    for (const textSize of [100, 200]) {
      test(`project outcomes preserve measured and written results at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        for (const { project, summaries } of [
          { project: 'smith-commerce', summaries: smithOutcomes },
          { project: 'lumen-ui', summaries: lumenOutcomes }
        ]) {
          await page.goto(`/portfolio/${project}/`)
          await page.evaluate(size => {
            document.documentElement.style.fontSize = `${size}%`
          }, textSize)
          await page.evaluate(() => document.fonts.ready)
          const card = page.getByRole('region', { name: 'Outcomes', exact: true })

          await expect(card.getByRole('heading', { level: 2 })).toHaveText('Outcomes')
          await expect(card.getByRole('list')).toHaveCount(1)
          await expect(card.getByRole('listitem')).toHaveCount(3)
          const accessibleText = await card.ariaSnapshot()

          for (const summary of summaries) {
            expect(accessibleText).toContain(summary)
            expect(accessibleText.split(summary)).toHaveLength(2)
          }
          const geometry = await card.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
            const clipped: string[] = []
            const broken: string[] = []
            let node = walker.nextNode()

            while (node) {
              if (node.textContent?.trim() && node.parentElement?.checkVisibility() && !node.parentElement.closest('.sr-only')) {
                const range = document.createRange()

                range.selectNodeContents(node)
                if ([...range.getClientRects()].some(rect => rect.width > 0 && (
                  rect.left < bounds.left || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
                ))) clipped.push(node.textContent.trim())
                for (const match of node.textContent.matchAll(/[A-Za-z]+|\d+(?:\.\d+)?[%+]?/gu)) {
                  range.setStart(node, match.index)
                  range.setEnd(node, match.index + match[0].length)
                  const lines = new Set([...range.getClientRects()]
                    .filter(rect => rect.width > 0).map(rect => Math.round(rect.y)))

                  if (lines.size > 1) broken.push(match[0])
                }
              }
              node = walker.nextNode()
            }
            return { broken, clipped }
          })

          expect(geometry.clipped).toEqual([])
          expect(geometry.broken).toEqual([])
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        }
      })
    }
  }

  test(`project outcomes pass enlarged-text accessibility checks in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    for (const project of ['smith-commerce', 'lumen-ui']) {
      await page.goto(`/portfolio/${project}/`)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      await expect(page.getByRole('region', { name: 'Outcomes', exact: true })).toBeVisible()
      await expectNoUnexpectedAccessibilityViolations(page)
    }
  })
}

test('project outcomes retain qualifiers, count suffixes, and mixed written claims without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  for (const [project, values, statement] of [
    ['justbit', ['10+'], 'Up to 70% organic traffic growth for selected clients'],
    ['void', ['35%', '60%', '95%+'], '95%+ sprint velocity'],
    ['xgames', ['56+'], 'Real-time geo-based live stream access across global audiences']
  ] as const) {
    await page.goto(`/portfolio/${project}/`)
    const card = page.getByRole('region', { name: 'Outcomes', exact: true })

    await expect(card.locator('[data-outcome-value]')).toHaveText([...values])
    expect(await card.ariaSnapshot()).toContain(statement)
    expect(await card.locator('[data-outcome-value]').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
  }
  await context.close()
})
