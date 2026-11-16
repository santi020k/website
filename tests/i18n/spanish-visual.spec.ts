import { expect, test } from '@playwright/test'

import { shouldRunVisualSnapshots, visualSnapshotSkipReason } from '../helpers/visual-regression'

// Spanish pages and the Now and Uses pages had no visual baseline. Like every other
// snapshot, these are maintained on macOS: run `pnpm exec playwright test
// tests/i18n/spanish-visual.spec.ts --update-snapshots` there after an intended change.
const routes = [
  { name: 'es-home', path: '/es/' },
  { name: 'es-about', path: '/es/about/' },
  { name: 'es-work', path: '/es/work/' },
  { name: 'es-uses', path: '/es/uses/' },
  { name: 'es-now', path: '/es/now/' },
  { name: 'uses', path: '/uses/' },
  { name: 'now', path: '/now/' }
]

if (shouldRunVisualSnapshots) {
  test.describe('Spanish and personal pages visual snapshots', () => {
    test.use({ reducedMotion: 'reduce' })

    for (const { name, path } of routes) {
      test(`${path} matches its visual snapshot`, async ({ page }) => {
        await page.goto(path)
        await page.evaluate(async () => document.fonts.ready)
        await expect(page).toHaveScreenshot(`${name}-page.png`)
      })
    }
  })
} else {
  console.info(visualSnapshotSkipReason)
}
