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
