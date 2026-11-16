import { expect, test } from '@playwright/test'

for (const route of ['/speaking/', '/portfolio/lumen-ui/', '/blog/deterministic-open-graph-images-without-design-lock-in/']) {
  test(`leading content stays visible throughout its entrance on ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(route)
    const headings = await page.locator('h1').evaluate(heading => {
      const frames = []
      let element: Element | null = heading

      while (element) {
        for (const animation of element.getAnimations()) {
          if (animation.effect instanceof KeyframeEffect) frames.push(...animation.effect.getKeyframes())
        }

        element = element.parentElement
      }

      return frames.filter(frame => frame.opacity !== undefined).map(frame => Number(frame.opacity))
    })

    expect(headings).not.toContain(0)
    await expect(page.locator('h1')).toBeVisible()
  })
}
