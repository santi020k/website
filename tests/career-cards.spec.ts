import { fileURLToPath } from 'node:url'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import sharp from 'sharp'

import { requireValue } from './helpers/assertions'

interface LogoBounds {
  width: number
  height: number
  left: number
  top: number
  right: number
  bottom: number
}

const measuredLogos = new Map<string, LogoBounds>()

const getLogoBounds = async (company: string): Promise<LogoBounds> => {
  const cached = measuredLogos.get(company)

  if (cached) return cached
  // Read the source pixels once per worker. WebKit can return an empty canvas
  // when drawing an offscreen lazy image, even after its decode promise resolves.
  const path = fileURLToPath(new URL(`../src/content/project/${company}/logo.webp`, import.meta.url))
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const bounds = { width: info.width, height: info.height, left: info.width, top: info.height, right: 0, bottom: 0 }

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if ((data[(y * info.width + x) * info.channels + 3] ?? 0) > 24) {
        bounds.left = Math.min(bounds.left, x)
        bounds.top = Math.min(bounds.top, y)
        bounds.right = Math.max(bounds.right, x + 1)
        bounds.bottom = Math.max(bounds.bottom, y + 1)
      }
    }
  }
  if (bounds.right <= bounds.left || bounds.bottom <= bounds.top) throw new Error(`${company} logo has no visible pixels`)
  measuredLogos.set(company, bounds)
  return bounds
}

for (const theme of ['light', 'dark']) {
  test(`career cards restore distinct company colors on hover and keyboard focus in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/work/')
    await page.evaluate(() => document.fonts.ready)
    const colors = new Set<string>()

    for (const link of await page.locator('[data-career-link]').all()) {
      const title = link.locator('[data-career-title]')
      const folio = link.locator('[data-career-folio]')

      await link.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      await link.evaluate(async element => {
        await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
      })
      const restingColor = await title.evaluate(element => getComputedStyle(element).color)
      const restingSurface = await folio.evaluate(element => getComputedStyle(element).backgroundColor)
      const restingBounds = await folio.boundingBox()

      await link.hover()
      await link.evaluate(async element => {
        await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
      })
      const hoverColor = await title.evaluate(element => getComputedStyle(element).color)
      const hoverSurface = await folio.evaluate(element => getComputedStyle(element).backgroundColor)

      expect(hoverColor).not.toBe(restingColor)
      expect(hoverSurface).not.toBe(restingSurface)
      expect(await folio.boundingBox()).toEqual(restingBounds)
      colors.add(hoverColor)
      const results = await new AxeBuilder({ page })
        .include('[data-career-link]:hover')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()

      expect(results.violations).toEqual([])
      await page.mouse.move(0, 0)
      await expect(title).toHaveCSS('color', restingColor)
      await expect(folio).toHaveCSS('background-color', restingSurface)
      await page.keyboard.press('Tab')
      await link.focus()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await expect(title).toHaveCSS('color', hoverColor)
      await expect(folio).toHaveCSS('background-color', hoverSurface)
      await link.evaluate(element => {
        element.blur()
      })
    }
    expect(colors.size).toBeGreaterThan(2)
  })

  for (const width of [320, 390, 768, 1440]) {
    for (const textSize of [100, 200]) {
      test(`career folios preserve dates and content at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.goto('/work/')
        await page.evaluate(size => {
          document.documentElement.style.fontSize = `${size}%`
        }, textSize)
        await page.evaluate(() => document.fonts.ready)
        const rows = page.locator('[data-timeline-row]')

        await rows.first().scrollIntoViewIfNeeded()
        expect(await rows.count()).toBeGreaterThan(1)
        await expect(rows.locator('[data-career-masthead]')).toHaveCount(3)
        await expect(rows.filter({ has: page.locator('[data-career-masthead]') }).locator('[data-career-title]')).toHaveText(['Smith Commerce', 'X Games', 'Void.GG'])
        const earlier = page.locator('[data-career-density="compact"]')

        await expect(earlier).toHaveCount(6)
        await expect(earlier.first().locator('[data-career-title]')).toHaveText('Optic Power')
        await expect(earlier.locator('[data-career-masthead]')).toHaveCount(0)
        await expect(page.getByRole('list', { name: 'Professional experience, newest first' })).toBeVisible()
        await expect(rows.first().locator('[data-career-date]')).toHaveText('May 2025 - Present')
        await expect(rows.first().locator('time')).toHaveAttribute('datetime', '2025-05-01')
        await expect(rows.filter({ hasText: 'Completed' }).first().locator('time')).toHaveCount(2)
        const rail = await rows.evaluateAll(items => items.map(row => {
          const link = row.querySelector('[data-career-link]')
          const year = row.querySelector('[data-career-year]')

          if (!link || !year) throw new Error('A career milestone must have a link and a year')
          const bounds = link.getBoundingClientRect()
          const yearBounds = year.getBoundingClientRect()
          const marker = getComputedStyle(link, '::after')
          const connector = getComputedStyle(link, '::before')
          const markerTransform = new DOMMatrixReadOnly(marker.transform === 'none' ? undefined : marker.transform)
          const connectorTransform = new DOMMatrixReadOnly(connector.transform === 'none' ? undefined : connector.transform)
          const markerLeft = bounds.left + Number.parseFloat(marker.left) + markerTransform.e
          const markerTop = bounds.top + Number.parseFloat(marker.top) + markerTransform.f
          const connectorLeft = bounds.left + Number.parseFloat(connector.left) + connectorTransform.e
          const connectorTop = bounds.top + Number.parseFloat(connector.top)

          return {
            markerX: markerLeft + Number.parseFloat(marker.width) / 2,
            markerY: markerTop + Number.parseFloat(marker.height) / 2,
            yearCenter: yearBounds.top + yearBounds.height / 2,
            connectorX: connectorLeft + Number.parseFloat(connector.width) / 2,
            connectorTop,
            connectorBottom: connectorTop + Number.parseFloat(connector.height),
            connectorVisible: connector.display !== 'none'
          }
        }))

        for (const point of rail) expect(point.markerY).toBeCloseTo(point.yearCenter, 0)
        for (const [index, segment] of rail.slice(0, -1).entries()) {
          const next = requireValue(rail[index + 1])

          expect(segment.connectorVisible).toBe(true)
          expect(segment.connectorX).toBeCloseTo(segment.markerX, 0)
          expect(segment.connectorX).toBeCloseTo(next.markerX, 0)
          expect(segment.connectorTop).toBeCloseTo(segment.markerY, 0)
          expect(segment.connectorBottom).toBeCloseTo(next.markerY, 0)
        }
        expect(rail.at(-1)?.connectorVisible, 'The rail ends at the final milestone').toBe(false)
        for (const row of await rows.all()) {
          const link = row.locator('[data-career-link]')

          await expect(link).toHaveAttribute('href', /^\/portfolio\/.+\/$/u)
          const company = await row.locator('[data-career-title]').innerText()
          const date = requireValue(await row.locator('[data-career-date]').textContent()).trim()

          await expect(link).toHaveAccessibleName(new RegExp(company.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
          await expect(link).toHaveAccessibleName(new RegExp(date.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
          await expect(link).toHaveAccessibleName(/Read case study/u)
          await expect(row.locator('[data-career-action]')).toHaveText('Read case study')
          const clipped = await link.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('[data-career-date], [data-career-title], [data-career-role], [data-career-description], [data-career-footer]')].some(child => {
              const rect = child.getBoundingClientRect()
              const style = getComputedStyle(child)

              return rect.left < bounds.left - 1 || rect.right > bounds.right + 1 ||
                rect.bottom > bounds.bottom + 1 || child.scrollWidth > child.clientWidth + 1 ||
                style.webkitLineClamp !== 'none'
            })
          })

          expect(clipped, 'Every date, title, description, and action remains fully visible').toBe(false)
        }
        const companies = await rows.locator('[data-career-identity]').evaluateAll(panels => panels.map(panel => {
          const company = panel.getAttribute('data-company')

          if (!company) throw new Error('Each logo needs its company identity')
          return company
        }))
        const sourceEntries = await Promise.all(companies.map(async company => {
          const bounds = await getLogoBounds(company)

          return [company, bounds] as const
        }))
        const sourceBounds = Object.fromEntries(sourceEntries)
        const marks = await rows.locator('[data-career-identity]').evaluateAll(async (panels, sources) => Promise.all(panels.map(async panel => {
          const image = panel.querySelector('img')
          const company = panel.getAttribute('data-company')

          if (!(image instanceof HTMLImageElement) || !company) throw new Error('Each company needs its original logo and identity')
          const loaded = new Promise<void>((resolve, reject) => {
            if (image.complete && image.naturalWidth > 0) {
              resolve()
              return
            }
            image.addEventListener('load', () => {
              resolve()
            }, { once: true })
            image.addEventListener('error', () => {
              reject(new Error(`${company} logo failed to load`))
            }, { once: true })
          })

          image.loading = 'eager'
          await loaded
          await image.decode()
          const alpha = sources[company]

          if (!alpha) throw new Error(`${company} is missing its source bounds`)
          const { width: sourceWidth, height: sourceHeight, left, top, right, bottom } = alpha
          const box = panel.getBoundingClientRect()
          const imageBox = image.getBoundingClientRect()
          const scale = Math.min(imageBox.width / sourceWidth, imageBox.height / sourceHeight)
          const x = imageBox.left + (imageBox.width - sourceWidth * scale) / 2
          const y = imageBox.top + (imageBox.height - sourceHeight * scale) / 2

          return {
            company,
            width: box.width,
            height: box.height,
            left: (x + left * scale - box.left) / box.width,
            right: (box.right - x - right * scale) / box.width,
            top: (y + top * scale - box.top) / box.height,
            bottom: (box.bottom - y - bottom * scale) / box.height,
            presence: Math.max((right - left) * scale / box.width, (bottom - top) * scale / box.height)
          }
        })), sourceBounds)

        expect(marks).toHaveLength(9)
        const firstMark = requireValue(marks[0])

        for (const mark of marks) {
          expect(mark.width, `${mark.company} shares the same background width`).toBeCloseTo(firstMark.width, 0)
          expect(mark.height, `${mark.company} shares the same background height`).toBeCloseTo(firstMark.height, 0)
          expect(mark.width / mark.height).toBeCloseTo(1.5, 1)
          expect(Math.min(mark.left, mark.right, mark.top, mark.bottom), `${mark.company} is entirely visible with breathing room`).toBeGreaterThan(0.08)
          expect(Math.abs(mark.left - mark.right), `${mark.company} is optically centered horizontally`).toBeLessThan(0.12)
          expect(Math.abs(mark.top - mark.bottom), `${mark.company} is optically centered vertically`).toBeLessThan(0.12)
          expect(mark.presence, `${mark.company} is legible relative to its background`).toBeGreaterThan(0.6)
          expect(mark.presence).toBeLessThan(0.85)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      })
    }
  }
}

test('career cards retain keyboard navigation, focus, and reduced motion', async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' })
  await page.goto('/work/')
  const links = page.locator('[data-career-link]')

  await links.nth(2).focus()
  await expect(links.nth(2)).toHaveCSS('outline-style', 'solid')
  await expect(links.nth(2)).toHaveCSS('outline-width', '2px')
  const duration = await links.nth(3).locator('[data-career-title]').evaluate(element => Number.parseFloat(getComputedStyle(element).transitionDuration))

  expect(duration).toBeLessThanOrEqual(0.001)
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(links.nth(3)).toBeFocused()
  const destination = await links.nth(3).getAttribute('href')

  await page.keyboard.press('Enter')
  await expect.poll(() => new URL(page.url()).pathname).toBe(destination)
})

for (const theme of ['light', 'dark'] as const) {
  test(`Spanish career history preserves chronology, company marks, and reflow in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/es/work/')
    const rows = page.locator('[data-career-row]')

    await expect(rows.locator('[data-career-title]')).toHaveText(['Smith Commerce', 'X Games', 'Void.GG', 'Optic Power', 'PADS', 'TEDx Medellin', 'Datagran', 'Justbit.site', 'Nebular Technologies'])
    await expect(rows.first().locator('[data-career-month]')).toHaveText('may')
    await expect(rows.first().locator('time')).toHaveAttribute('datetime', '2025-05-01')
    await expect(rows.locator('[data-career-identity] img')).toHaveCount(9)
    for (const link of await rows.locator('[data-career-link]').all()) {
      await expect(link).toHaveAttribute('href', /^\/es\/portfolio\/.+\/$/u)
      const company = await link.locator('[data-career-title]').innerText()
      const action = await link.locator('[data-career-action]').innerText()
      const date = requireValue(await link.locator('[data-career-date]').textContent()).trim()

      for (const label of [company, action, date]) {
        await expect(link).toHaveAccessibleName(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'))
      }
      await expect(link.locator('img')).toHaveAttribute('alt', '')
    }
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const clipped = await rows.evaluateAll(items => items.flatMap(row => [...row.querySelectorAll('[data-career-identity], h3, p, time')].filter(element => {
          const bounds = element.getBoundingClientRect()

          return bounds.left < 0 || bounds.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1
        }).map(element => element.textContent)))

        expect(clipped, `Spanish career content at ${width}px and ${size}%`).toEqual([])
      }
    }
  })
}
