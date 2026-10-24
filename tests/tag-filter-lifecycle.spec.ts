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

test('a newer navigation cancels the previous topic restoration frame', async ({ page }) => {
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

test('an earlier page-load leaves a newer topic restoration in place', async ({ page }) => {
  await page.goto('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)

  const typescriptRequest = await holdRequest(page, '**/blog/tags/typescript/')

  try {
    // Start the TypeScript topic navigation after React's body swap, before
    // Astro finishes that page's scripts and dispatches its page-load event.
    const capturedTop = await page.evaluate(() => new Promise<number>((resolve, reject) => {
      const react = document.querySelector<HTMLAnchorElement>('[data-blog-tag-filter] a[href="/blog/tags/react/"]')

      if (!react) {
        reject(new Error('React topic is missing'))

        return
      }

      document.addEventListener('astro:after-swap', () => {
        const filter = document.querySelector<HTMLElement>('[data-blog-tag-filter]')
        const typescript = filter?.querySelector<HTMLAnchorElement>('a[href="/blog/tags/typescript/"]')

        if (!filter || !typescript) {
          reject(new Error('TypeScript topic is missing'))

          return
        }

        filter.scrollIntoView({ behavior: 'instant', block: 'center' })

        const { bottom, top } = filter.getBoundingClientRect()

        if (top <= 0 || bottom >= window.innerHeight) {
          reject(new Error('Topic filter is not fully visible'))

          return
        }

        document.addEventListener('astro:page-load', () => {
          resolve(top)
        }, { once: true })
        typescript.click()
      }, { once: true })

      react.click()
    }))

    await expect(page).toHaveURL(/\/blog\/tags\/react\/$/u)
    await typescriptRequest.release()
    await expect(page).toHaveURL(/\/blog\/tags\/typescript\/$/u)

    const filter = page.locator('[data-blog-tag-filter]')
    const typescript = filter.locator('a[href="/blog/tags/typescript/"]')

    await expect(typescript).toHaveAttribute('aria-current', 'page')
    await expect(typescript).toBeFocused()

    // Sample consecutive paints so the render correction cannot drift the strip.
    const tops = await filter.evaluate(async element => {
      const values: number[] = []

      for (let frame = 0; frame < 4; frame += 1) {
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            resolve()
          })
        })
        values.push(element.getBoundingClientRect().top)
      }

      return values
    })

    expect(Math.max(...tops.map(top => Math.abs(top - capturedTop)))).toBeLessThanOrEqual(0.5)
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  }
})

test('an earlier page-load of the same topic leaves a repeated topic restoration in place', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)

  // The first React document loads normally; only the repeated click stays in preparation.
  const repeatedRequest = await holdRequest(page, '**/blog/tags/react/', 2)

  try {
    // Click React again after its own body swap, before that page's page-load. Astro
    // still fetches a same-path URL without a hash, so the URL already matches while
    // the older page-load runs against the filter the repeated click started from.
    const captured = await page.evaluate(() => new Promise<{
      path: string
      sameFilter: boolean
      scrollLeft: number
      top: number
    }>((resolve, reject) => {
      const react = document.querySelector<HTMLAnchorElement>('[data-blog-tag-filter] a[href="/blog/tags/react/"]')

      if (!react) {
        reject(new Error('React topic is missing'))

        return
      }

      document.addEventListener('astro:after-swap', () => {
        const filter = document.querySelector<HTMLElement>('[data-blog-tag-filter]')
        const current = filter?.querySelector<HTMLAnchorElement>('a[href="/blog/tags/react/"]')

        if (!filter || !current) {
          reject(new Error('Selected React topic is missing'))

          return
        }

        filter.scrollIntoView({ behavior: 'instant', block: 'center' })

        // Swipe only the strip so the selected pill sits centered away from both ends.
        const strip = filter.getBoundingClientRect()
        const pill = current.getBoundingClientRect()

        filter.scrollLeft += pill.left + pill.width / 2 - (strip.left + strip.width / 2)

        const { bottom, left, right, top } = filter.getBoundingClientRect()
        const exposed = current.getBoundingClientRect()
        const { scrollLeft } = filter

        if (top <= 0 || bottom >= window.innerHeight || scrollLeft <= 0 ||
          exposed.left < Math.max(left, 0) || exposed.right > Math.min(right, window.innerWidth)) {
          reject(new Error('Selected React topic is not exposed in a scrolled, visible strip'))

          return
        }

        document.addEventListener('astro:page-load', () => {
          resolve({
            path: window.location.pathname,
            sameFilter: document.querySelector('[data-blog-tag-filter]') === filter,
            scrollLeft,
            top
          })
        }, { once: true })
        current.click()
      }, { once: true })

      react.click()
    }))

    // The older page-load saw the matching URL and the repeated click's own source filter.
    expect(captured.path).toBe('/blog/tags/react/')
    expect(captured.sameFilter).toBe(true)

    const filter = page.locator('[data-blog-tag-filter]')

    // Mark the older strip and the next page-load so only the repeated navigation's
    // own completion, with a newly installed filter, can satisfy the waits below.
    await filter.evaluate(element => {
      element.dataset.olderFilter = ''
    })
    await page.evaluate(() => {
      delete document.documentElement.dataset.repeatedLoaded
      document.addEventListener('astro:page-load', () => {
        document.documentElement.dataset.repeatedLoaded = ''
      }, { once: true })
    })
    await repeatedRequest.release()
    await expect(page.locator('html')).toHaveAttribute('data-repeated-loaded', '')
    await expect(page.locator('[data-older-filter]')).toHaveCount(0)

    const react = filter.locator('a[href="/blog/tags/react/"]')

    await expect(react).toHaveAttribute('aria-current', 'page')
    await expect(react).toBeFocused()

    // Sample consecutive paints so the render correction cannot drift the strip.
    const settled = await react.evaluate(async link => {
      const strip = link.closest<HTMLElement>('[data-blog-tag-filter]')

      if (!strip) throw new Error('Selected topic is outside the filter strip')

      const tops: number[] = []

      for (let frame = 0; frame < 4; frame += 1) {
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            resolve()
          })
        })
        tops.push(strip.getBoundingClientRect().top)
      }

      const pill = link.getBoundingClientRect()
      const bounds = strip.getBoundingClientRect()

      return {
        clippedLeft: Math.max(bounds.left, 0) - pill.left,
        clippedRight: pill.right - Math.min(bounds.right, window.innerWidth),
        overflows: strip.scrollWidth > strip.clientWidth,
        scrollLeft: strip.scrollLeft,
        tops
      }
    })

    expect(settled.overflows).toBe(true)
    expect(settled.clippedLeft).toBeLessThanOrEqual(0)
    expect(settled.clippedRight).toBeLessThanOrEqual(0)
    expect(settled.scrollLeft).toBeCloseTo(captured.scrollLeft, 0)
    expect(Math.max(...settled.tops.map(top => Math.abs(top - captured.top)))).toBeLessThanOrEqual(0.5)
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  }
})
