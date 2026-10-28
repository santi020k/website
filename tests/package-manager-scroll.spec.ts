import { expect, type JSHandle, type Locator, type Page, test } from '@playwright/test'

const article = '/blog/storybook-in-action-with-next-js-tailwind-and-typescript/'
const storageKey = 'preferred-package-manager'

// These two synchronized groups are thousands of pixels apart in the article.
const groups = [
  { name: 'start', label: 'Choose a package manager to start Storybook' },
  { name: 'integrations', label: 'Choose a package manager to install the Storybook integrations' }
] as const

type CodeTabsGroup = typeof groups[number]

interface Choice {
  name: string
  value: string
}

interface ReaderPosition {
  origin: CodeTabsGroup
  synced: CodeTabsGroup
  top: number
}

const pnpm: Choice = { name: 'pnpm', value: 'pnpm' }
const bun: Choice = { name: 'Bun', value: 'bun' }

interface ScrollRecorder {
  changes: string[]
  scrollSamples: number[]
  stop: () => void
}

const codeTabs = (page: Page, label: string): Locator => page
  .locator('[data-package-manager-code-tabs]')
  .filter({ has: page.getByRole('tablist', { exact: true, name: label }) })

const choiceTab = (group: Locator, choice: Choice): Locator => group.getByRole('tab', { exact: true, name: choice.name })

const openArticle = async (page: Page) => {
  // Serve an empty client so comments stay inert without contacting the provider.
  await page.route('https://giscus.app/**', route => route.fulfill({
    body: '',
    contentType: 'application/javascript',
    headers: { 'Access-Control-Allow-Origin': '*' }
  }))
  await page.goto(article)
  await page.evaluate(() => document.fonts.ready)

  for (const { label } of groups) await expect(codeTabs(page, label)).toHaveAttribute('data-ui-bound', 'true')
}

const centerInViewport = (target: Locator): Promise<number> => target.evaluate(element => {
  const box = element.getBoundingClientRect()

  window.scrollTo({ behavior: 'instant', top: scrollY + box.top + (box.height - innerHeight) / 2 })

  return scrollY
})

// Sample the scroll position on every paint and log each group's change event.
const recordScroll = (page: Page): Promise<JSHandle<ScrollRecorder>> => page.evaluateHandle(() => {
  const changes: string[] = []
  const scrollSamples: number[] = []
  let frame = 0

  const sample = () => {
    scrollSamples.push(scrollY)
    frame = requestAnimationFrame(sample)
  }

  const record = (event: Event) => {
    if (!(event.target instanceof HTMLElement)) return

    const label = event.target.querySelector('[role="tablist"]')?.getAttribute('aria-label') ?? ''

    changes.push(`${label}=${event.target.dataset.value ?? ''}`)
  }

  sample()
  document.addEventListener('ui:tabs-change', record)

  return {
    changes,
    scrollSamples,
    stop: () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('ui:tabs-change', record)
    }
  }
})

// Bounded observation: keep sampling for 30 more paints, enough to catch a smooth scroll starting.
const finishRecording = (recorder: JSHandle<ScrollRecorder>) => recorder.evaluate(async state => {
  const { changes, scrollSamples, stop } = state

  for (let index = 0; index < 30; index += 1) {
    await new Promise<void>(resolve => requestAnimationFrame(() => {
      resolve()
    }))
  }
  stop()

  return { changes, scrollSamples }
})

const expectSelected = async (group: Locator, choice: Choice) => {
  const selected = choiceTab(group, choice)

  await expect(selected).toHaveAttribute('aria-selected', 'true')
  await expect(selected).toHaveAttribute('tabindex', '0')
  await expect(group.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1)
  await expect(group.locator('[role="tabpanel"]:visible')).toHaveAttribute('data-value', choice.value)
}

const expectReaderStaysInPlace = async (
  page: Page,
  { origin, synced, top }: ReaderPosition,
  choice: Choice,
  interact: () => Promise<void>
) => {
  const anchoring = await page.evaluate(() => getComputedStyle(document.documentElement).overflowAnchor)
  const recorder = await recordScroll(page)

  await interact()
  await expectSelected(codeTabs(page, origin.label), choice)
  await expectSelected(codeTabs(page, synced.label), choice)

  const { changes, scrollSamples } = await finishRecording(recorder)

  await recorder.dispose()

  expect(scrollSamples.filter(sample => Math.abs(sample - top) > 1)).toEqual([])
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowAnchor)).toBe(anchoring)
  expect(changes).toHaveLength(2)
  expect(changes).toEqual(expect.arrayContaining([`${origin.label}=${choice.value}`, `${synced.label}=${choice.value}`]))
  await expect(choiceTab(codeTabs(page, origin.label), choice)).toBeInViewport({ ratio: 1 })
}

const selectByPointerThenKeyboard = async (page: Page, origin: CodeTabsGroup, synced: CodeTabsGroup) => {
  const originTabs = codeTabs(page, origin.label)
  const top = await centerInViewport(originTabs)

  await expect(codeTabs(page, synced.label)).not.toBeInViewport()
  await expectReaderStaysInPlace(page, { origin, synced, top }, pnpm, () => choiceTab(originTabs, pnpm).click())
  // WebKit does not focus buttons on click, so give the keyboard path an explicit start.
  await choiceTab(originTabs, pnpm).focus()
  await expectReaderStaysInPlace(page, { origin, synced, top }, bun, () => page.keyboard.press('ArrowRight'))
  await expect(choiceTab(originTabs, bun)).toBeFocused()
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test.describe(`Package-manager sync scroll ${viewport.width}px / ${reducedMotion} motion`, () => {
      test.use({ reducedMotion, viewport })

      for (const [origin, synced] of [[groups[0], groups[1]], [groups[1], groups[0]]] as const) {
        test(`${origin.name} group selection syncs without moving the reader, then persists`, async ({ page }) => {
          await openArticle(page)
          for (const { label } of groups) await expectSelected(codeTabs(page, label), { name: 'npm', value: 'npm' })

          await selectByPointerThenKeyboard(page, origin, synced)
          expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(bun.value)

          await page.reload()
          for (const { label } of groups) await expectSelected(codeTabs(page, label), bun)
        })
      }

      test('selection syncs without moving the reader when storage is unavailable', async ({ page }) => {
        const errors: string[] = []

        page.on('pageerror', error => errors.push(error.message))
        await page.addInitScript(() => {
          for (const method of ['getItem', 'setItem'] as const) {
            Storage.prototype[method] = () => {
              throw new DOMException('Storage unavailable', 'SecurityError')
            }
          }
        })
        await openArticle(page)
        await selectByPointerThenKeyboard(page, groups[0], groups[1])

        await page.reload()
        for (const { label } of groups) await expectSelected(codeTabs(page, label), { name: 'npm', value: 'npm' })
        expect(errors).toEqual([])
      })

      test('keyboard selection reveals a manager above the header clearance', async ({ page }) => {
        await openArticle(page)
        const group = codeTabs(page, groups[0].label)

        await group.getByRole('tab', { name: 'npm', exact: true }).evaluate(element => {
          element.focus({ preventScroll: true })
          window.scrollTo({ behavior: 'instant', top: scrollY + element.getBoundingClientRect().top - 8 })
        })
        await page.keyboard.press('ArrowRight')
        const selected = group.getByRole('tab', { name: 'yarn', exact: true })

        await expect(selected).toBeFocused()
        await expect(selected).toBeInViewport({ ratio: 1 })
        await expect.poll(() => selected.evaluate(element => {
          const clearance = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0

          return element.getBoundingClientRect().top >= clearance - 1
        })).toBe(true)
      })
    })
  }
}
