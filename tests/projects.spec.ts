import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const width of [320, 375, 768, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`projects remain usable at ${width}px in ${theme} mode`, async ({ page: screen }) => {
      await screen.setViewportSize({ height: 900, width })
      await screen.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await screen.goto('/projects/')

      await expect(screen.getByRole('heading', { level: 1 })).toHaveText('Built for the love of it.')
      await expect(screen.locator('html')).toHaveAttribute('data-theme', theme)
      const projects = screen.locator('[data-project-gallery-card]')
      expect(await projects.count()).toBeGreaterThan(1)

      const explore = screen.getByRole('link', { name: 'Explore projects', exact: true })
      await explore.focus()
      await expect(explore).toBeFocused()
      await screen.keyboard.press('Enter')
      await expect(screen).toHaveURL(/\/projects\/#projects$/)

      const project = projects.first().getByRole('link')
      await project.focus()
      await expect(project).toBeFocused()
      await expect(project).toHaveAttribute('href', /\/portfolio\/.+\/$/)
      const image = projects.first().locator('img')
      await expect.poll(() => image.evaluate(element => (
        element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
      ))).toBe(true)

      expect(await screen.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await expectNoUnexpectedAccessibilityViolations(screen)
      await screen.keyboard.press('Enter')
      await expect(screen).toHaveURL(/\/portfolio\/.+\/$/)
      await expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }
}

test('editorial project cards keep concise copy and a single named destination', async ({ page: screen }) => {
  await screen.goto('/projects/')
  const postlens = screen.locator('[data-project-gallery-card]').filter({
    has: screen.getByRole('heading', { name: 'PostLens', exact: true })
  })
  const project = postlens.getByRole('link', { name: /PostLens.*View project/ })
  await expect(project).toHaveCount(1)
  await expect(project).toHaveAttribute('href', '/portfolio/postlens/')
  await expect(postlens.locator('p')).toHaveText(
    'A private photo studio for iPhone and iPad. Choose your best shots, refine them, and compose layouts ready to share.'
  )
  await expect(postlens.getByRole('list', { name: 'Core technologies' }).getByRole('listitem')).toHaveText([
    'Swift', 'SwiftUI', 'iOS'
  ])
  await expect(postlens.locator('[data-site-pill]')).toHaveText('Active')

  // Keep the complete case-study description independent of its short gallery copy.
  await project.click()
  await expect(screen.locator('meta[name="description"]')).toHaveAttribute('content', /Built a private visual content studio for iPhone and iPad/)
})

test('editorial project cards retain their full text and link at enlarged mobile text sizes', async ({ page: screen }) => {
  await screen.setViewportSize({ width: 390, height: 844 })
  await screen.emulateMedia({ reducedMotion: 'reduce' })
  await screen.goto('/projects/')
  await screen.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })

  const project = screen.getByRole('link', { name: /Between Contractions.*View project/ })
  await project.focus()
  await expect(project).toBeFocused()
  await expect(project.getByRole('heading')).toHaveText('Between Contractions')
  await expect(project.locator('p')).toHaveText(
    'A calm, private contraction timer. Track each contraction, review your rhythm, and share the moment with your partner.'
  )
  const layout = await project.evaluate(element => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      overflows: element.scrollWidth > element.clientWidth,
      right: box.right,
      viewport: document.documentElement.clientWidth
    }
  })
  expect(layout.overflows).toBe(false)
  expect(layout.right).toBeLessThanOrEqual(layout.viewport)
  expect(layout.outlineStyle).toBe('solid')
  expect(layout.outlineWidth).toBeGreaterThanOrEqual(2)
  expect(await screen.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await screen.keyboard.press('Enter')
  await expect(screen).toHaveURL(/\/portfolio\/between-contractions\/$/)
})
