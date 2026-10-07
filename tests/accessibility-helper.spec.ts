import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const fixture = `<!doctype html>
<html lang="en"><head><title>Animation accessibility fixture</title></head>
<body><main><h1>Animation accessibility</h1><p id="animated">Readable content</p></main></body></html>`

test('accessibility scans ignore unfinished animations on unrendered elements', async ({ page }) => {
  await page.setContent(fixture)
  await page.evaluate(() => {
    const target = document.getElementById('animated')
    if (!target) throw new Error('Missing animation fixture')
    const animation = target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000 })
    animation.pause()
    target.style.display = 'none'
  })

  await expectNoUnexpectedAccessibilityViolations(page)
  expect(await page.evaluate(() => document.getAnimations().some(animation => animation.playState === 'paused'))).toBe(true)
})

test('accessibility scans await finite animations on rendered elements', async ({ page }) => {
  await page.setContent(fixture)
  await page.evaluate(() => {
    const target = document.getElementById('animated')
    if (!target) throw new Error('Missing animation fixture')
    target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, fill: 'forwards' })
  })

  await expectNoUnexpectedAccessibilityViolations(page)
  expect(await page.evaluate(() => document.getAnimations().map(animation => animation.playState))).toEqual(['finished'])
})
