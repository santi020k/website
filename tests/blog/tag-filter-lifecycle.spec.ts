import { expect, type Page, type Route, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } })

// Holds the matching document request until the test releases it, so the
// navigation stays in preparation exactly as long as the test needs. Earlier
// matches than `occurrence` load normally.
const holdRequest = async (page: Page, url: string, occurrence = 1) => {
  let deliver: (route: Route) => void = () => undefined
  let seen = 0

  const held = new Promise<Route>(resolve => {
    deliver = resolve
  })

  await page.route(url, async route => {
    seen += 1

    if (seen < occurrence) {
      await route.continue()

      return
    }

    deliver(route)
  })

  return {
    release: async () => {
      const route = await held

      await route.continue()
    }
  }
}

test('a newer navigation prevents an outgoing topic page from moving the viewport', async ({ page }) => {
  await page.goto('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await page.locator('[data-blog-tag-filter]').evaluate(element => {
    element.scrollIntoView({ behavior: 'instant', block: 'center' })
  })
  await page.route('**/about/', () => new Promise<void>(() => undefined))

  try {
    const positions = await page.evaluate(() => new Promise<number[]>((resolve, reject) => {
      const topic = document.querySelector<HTMLAnchorElement>('[data-blog-tag-filter] a[href="/blog/tags/react/"]')

      if (!topic) {
        reject(new Error('React topic is missing'))

        return
      }

      document.addEventListener('astro:page-load', () => {
        const about = document.querySelector<HTMLAnchorElement>('nav[aria-label="Main menu"] a[href="/about/"]')

        if (!about) {
          reject(new Error('About navigation link is missing'))

          return
        }

        about.click()
        window.scrollTo({ behavior: 'instant', top: 0 })

        const samples: number[] = []
        const sample = () => {
          samples.push(window.scrollY)

          if (samples.length === 4) resolve(samples)
          else requestAnimationFrame(sample)
        }

        requestAnimationFrame(sample)
      }, { once: true })

      topic.click()
    }))

    await expect(page).toHaveURL(/\/blog\/tags\/react\/$/u)
    expect(positions).toEqual([0, 0, 0, 0])
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  }
})

test('a topic chosen during an earlier page swap settles at the newer archive heading', async ({ page }) => {
  await page.goto('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  const held = await holdRequest(page, '**/blog/tags/typescript/')

  try {
    await page.evaluate(() => {
      document.addEventListener('astro:after-swap', () => {
        const next = document.querySelector<HTMLAnchorElement>('[data-blog-related-topics] a[href="/blog/tags/typescript/"]')

        if (!next) throw new Error('Related TypeScript link is missing')

        next.scrollIntoView({ block: 'center', behavior: 'instant' })
        next.click()
      }, { once: true })
    })
    await page.locator('[data-blog-tag-filter] a[href="/blog/tags/react/"]').click()
    await expect(page).toHaveURL('/blog/tags/react/')
    await held.release()
    await expect(page).toHaveURL('/blog/tags/typescript/')
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
    await expect(page.locator('#main')).toBeFocused()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('TypeScript')
    await expect(page.locator('[data-blog-related-topics] [aria-current]')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  }
})

test('repeated mixed-feed navigation does not restore an outgoing topic position', async ({ page }) => {
  await page.goto('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  const held = await holdRequest(page, '**/blog/', 2)

  try {
    await page.evaluate(() => {
      document.addEventListener('astro:after-swap', () => {
        const current = document.querySelector<HTMLAnchorElement>('[data-blog-tag-filter] a[href="/blog/"]')

        if (!current) throw new Error('All posts link is missing')

        current.scrollIntoView({ block: 'center', behavior: 'instant' })
        current.click()
      }, { once: true })
    })
    await page.locator('[data-blog-tag-filter] a[href="/blog/"]').click()
    await held.release()
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
    await expect(page.locator('#main')).toBeFocused()
    await expect(page.locator('[data-blog-tag-filter] a[href="/blog/"]')).toHaveAttribute('aria-current', 'page')
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  }
})
