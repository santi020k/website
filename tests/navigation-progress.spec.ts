import { expect, type Locator, type Page, type Route, test } from '@playwright/test'

test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } })

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
})

const mainMenuLink = (page: Page, name: string) => page
  .getByRole('navigation', { name: 'Main menu' })
  .first()
  .getByRole('link', { name, exact: true })

// Hover prefetch would otherwise consume the held request before navigation does.
const disablePrefetch = (link: Locator) => link.evaluate(element => {
  element.setAttribute('data-astro-prefetch', 'false')
})

// Holds the matching document request until the test releases it, so the
// navigation stays in preparation exactly as long as the test needs.
const holdRequest = async (page: Page, url: string) => {
  let deliver: (route: Route) => void = () => undefined

  const held = new Promise<Route>(resolve => {
    deliver = resolve
  })

  await page.route(url, route => {
    deliver(route)
  })

  return {
    release: async () => {
      const route = await held

      await route.continue()
    }
  }
}

// Reads the bar on consecutive paints so a queued frame cannot flip it
// between two eventually-passing assertions.
const sampleLoadingFrames = (progress: Locator, frames: number) => progress.evaluate(async (bar, count) => {
  const values: boolean[] = []

  for (let frame = 0; frame < count; frame += 1) {
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
    values.push(bar.classList.contains('is-loading'))
  }

  return values
}, frames)

const repeat = (value: boolean, count: number) => Array.from({ length: count }, () => value)

test('a same-page anchor cancels a stalled navigation without leaving progress running', async ({ page }) => {
  await page.goto('/blog/')

  const progress = page.locator('#nav-progress')
  const about = mainMenuLink(page, 'About')

  await expect(progress).toHaveClass(/is-complete/u)
  await disablePrefetch(about)
  await holdRequest(page, '**/about/')
  await about.click()
  await expect(progress).toHaveClass(/is-loading/u)
  await page.getByRole('link', { name: 'Explore the writing' }).click()
  await expect(page).toHaveURL(/\/blog\/#posts$/u)
  await expect(progress).not.toHaveClass(/is-loading/u)
  await expect(progress).toHaveClass(/is-complete/u)
  await expect(progress).toHaveCSS('opacity', '0')
})

test('a cancellation before the queued loading frames keeps progress idle', async ({ page }) => {
  await page.goto('/blog/')

  const progress = page.locator('#nav-progress')

  await expect(progress).toHaveClass(/is-complete/u)
  await holdRequest(page, '**/about/')

  // Both clicks run in one task, so the reset frames are still queued when
  // the same-page anchor aborts the preparation.
  const result = await page.evaluate(async () => {
    const bar = document.getElementById('nav-progress')
    const about = document.querySelector<HTMLAnchorElement>('nav[aria-label="Main menu"] a[href="/about/"]')
    const anchor = document.querySelector<HTMLAnchorElement>('a[href="#posts"]')

    if (!bar || !about || !anchor) throw new Error('Navigation progress fixtures are missing')

    about.click()

    const resetStarted = !bar.classList.contains('is-complete')

    anchor.click()

    const loadingFrames: boolean[] = []

    for (let frame = 0; frame < 4; frame += 1) {
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
      loadingFrames.push(bar.classList.contains('is-loading'))
    }

    return { completed: bar.classList.contains('is-complete'), loadingFrames, resetStarted }
  })

  expect(result).toEqual({ completed: true, loadingFrames: repeat(false, 4), resetStarted: true })
  await expect(page).toHaveURL(/\/blog\/#posts$/u)
  await expect(progress).toHaveCSS('opacity', '0')
})

test('a replacement navigation keeps progress running until its own page load', async ({ page }) => {
  await page.goto('/blog/')

  const progress = page.locator('#nav-progress')
  const about = mainMenuLink(page, 'About')
  const work = mainMenuLink(page, 'Work')

  await expect(progress).toHaveClass(/is-complete/u)
  await disablePrefetch(about)
  await disablePrefetch(work)
  await holdRequest(page, '**/about/')

  const workRequest = await holdRequest(page, '**/work/')

  await about.click()
  await expect(progress).toHaveClass(/is-loading/u)
  await work.click()
  await expect(progress).toHaveClass(/is-loading/u)
  expect(await sampleLoadingFrames(progress, 8)).toEqual(repeat(true, 8))
  await expect(page).toHaveURL(/\/blog\/$/u)
  await workRequest.release()
  await expect(page).toHaveURL(/\/work\/$/u)
  await expect(progress).toHaveClass(/is-complete/u)
  await expect(progress).toHaveCSS('opacity', '0')
})

test('a navigation after a cancelled one still shows and completes progress', async ({ page }) => {
  await page.goto('/blog/')

  const progress = page.locator('#nav-progress')
  const about = mainMenuLink(page, 'About')
  const projects = mainMenuLink(page, 'Projects')

  await expect(progress).toHaveClass(/is-complete/u)
  await disablePrefetch(about)
  await disablePrefetch(projects)
  await holdRequest(page, '**/about/')

  const projectsRequest = await holdRequest(page, '**/projects/')

  await about.click()
  await expect(progress).toHaveClass(/is-loading/u)
  await page.getByRole('link', { name: 'Explore the writing' }).click()
  await expect(page).toHaveURL(/\/blog\/#posts$/u)
  await expect(progress).toHaveClass(/is-complete/u)
  await projects.click()
  await expect(progress).toHaveClass(/is-loading/u)
  expect(await sampleLoadingFrames(progress, 4)).toEqual(repeat(true, 4))
  await projectsRequest.release()
  await expect(page).toHaveURL(/\/projects\/$/u)
  await expect(progress).toHaveClass(/is-complete/u)
  await expect(progress).toHaveCSS('opacity', '0')
})

test('an earlier page-load cannot finish a newer pending navigation', async ({ page }) => {
  await page.goto('/blog/')

  const progress = page.locator('#nav-progress')

  await expect(progress).toHaveClass(/is-complete/u)

  const workRequest = await holdRequest(page, '**/work/')

  // Start the next real navigation after the first body swap, before Astro
  // finishes that page's scripts and dispatches its page-load event.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    document.addEventListener('astro:after-swap', () => {
      const work = document.querySelector<HTMLAnchorElement>('nav[aria-label="Main menu"] a[href="/work/"]')

      if (!work) {
        reject(new Error('Work navigation link is missing'))

        return
      }

      document.addEventListener('astro:page-load', () => {
        resolve()
      }, { once: true })
      work.click()
    }, { once: true })

    const about = document.querySelector<HTMLAnchorElement>('nav[aria-label="Main menu"] a[href="/about/"]')

    if (!about) {
      reject(new Error('About navigation link is missing'))

      return
    }

    about.click()
  }))

  await expect(page).toHaveURL(/\/about\/$/u)
  await expect(progress).toHaveClass(/is-loading/u)
  expect(await sampleLoadingFrames(progress, 4)).toEqual(repeat(true, 4))
  await workRequest.release()
  await expect(page).toHaveURL(/\/work\/$/u)
  await expect(progress).toHaveClass(/is-complete/u)
  await expect(progress).toHaveCSS('opacity', '0')
})
