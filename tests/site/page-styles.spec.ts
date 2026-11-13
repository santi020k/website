import { expect, test } from '@playwright/test'

const pages = [
  { route: '/', selector: '.studio-feature-grid' },
  { route: '/about/', selector: '.about-hero' },
  { route: '/work/', selector: '.work-hero-grid' },
  { route: '/history/', selector: '.history-hero-stage' }
]

const properties = ['display', 'grid-template-columns', 'gap', 'padding', 'color', 'font-size']

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`page layout and theme are ready at the first painted frame at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)

      const expected: string[][] = []

      for (const destination of pages) {
        await page.goto(destination.route)
        await page.evaluate(() => document.fonts.ready)
        expected.push(await page.locator(destination.selector).first().evaluate((element, names) => {
          const styles = getComputedStyle(element)

          return names.map(name => styles.getPropertyValue(name))
        }, properties))
      }

      // Compare client navigation from another route with each direct page load.
      await page.goto('/blog/')
      await page.evaluate(() => document.fonts.ready)

      for (const [index, destination] of pages.entries()) {
        await page.evaluate(route => {
          const link = document.createElement('a')

          link.id = 'page-style-navigation'
          link.href = route
          link.textContent = 'Visit next page'
          document.body.append(link)
        }, destination.route)

        const [styles] = await Promise.all([
          page.evaluate(({ selector, names }) => new Promise<string[]>(resolve => {
            document.addEventListener('astro:after-swap', () => {
              // Let all swap listeners restore theme and the browser attach
              // destination styles, then inspect the first frame before paint.
              requestAnimationFrame(() => {
                const element = document.querySelector(selector)

                if (!element) {
                  resolve([])
                  return
                }

                const styles = getComputedStyle(element)

                resolve(names.map(name => styles.getPropertyValue(name)))
              })
            }, { once: true })
          }), { selector: destination.selector, names: properties }),
          page.evaluate(() => new Promise<void>(resolve => {
            document.addEventListener('astro:page-load', () => {
              resolve()
            }, { once: true })
          })),
          page.locator('#page-style-navigation').click()
        ])

        expect(styles).toEqual(expected[index])
      }
    })
  }
}
