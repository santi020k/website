import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('the hero connects products, personal background, and the full portfolio', async ({ page }) => {
  await page.goto('/')

  const hero = page.locator('[data-home-hero]')

  await expect(page.locator('h1')).toHaveCount(1)
  await expect(hero.locator('h1')).toContainText('I build products.')
  await expect(hero.locator('.maker-hero-description')).toHaveText('Engineering lead. Creator of Lumen UI and PostLens. I build commerce platforms, native apps, and tools that help teams ship.')
  await expect(hero.locator('a[href="/portfolio/"]')).toHaveAccessibleName('See selected work')
  await expect(hero.locator('a[href="/portfolio/"]')).toHaveAttribute('href', '/portfolio/')
  await expect(hero.locator('a[href="/portfolio/lumen-ui/"]')).toHaveAttribute('href', '/portfolio/lumen-ui/')
  await expect(hero.locator('a[href="/portfolio/postlens/"]')).toHaveAttribute('href', '/portfolio/postlens/')
  await expect(hero.locator('img[alt="Portrait of Santiago Molina, smiling"]')).toBeVisible()
  await expect(hero.locator('img[alt="Portrait of Santiago Molina, smiling"]')).toHaveJSProperty('complete', true)

  await expect(hero.locator('a[href="/work-with-me/"]')).toHaveAccessibleName('Work with me')
  await hero.locator('a[href="/work-with-me/"]').click()
  await expect(page).toHaveURL(/\/work-with-me\/$/)
  await expect(page.locator('h1')).toContainText('Let’s work')
  await expect(page.locator('form[data-whatsapp-intake]')).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(hero).toBeVisible()
  await expect(page.locator('[data-particles-bg]')).toBeVisible()
})

test('hero product links preserve destinations and keyboard navigation', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const products = page.getByRole('navigation', { name: 'Featured products' })
  const links = products.getByRole('link')

  await expect(links).toHaveCount(3)
  await expect(links.nth(0)).toHaveAccessibleName('Lumen UI Web and native components')
  await expect(links.nth(1)).toHaveAccessibleName('PostLens Private photo editing for iPhone')
  await expect(links.nth(2)).toHaveAccessibleName('Explore all projects')
  await expect(links.nth(2)).toBeVisible()
  await expect(links.nth(2)).toHaveAttribute('href', '/projects/')
  await links.first().focus()
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
  await expect(links.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/portfolio\/postlens\/$/)
  await page.goBack()
  await links.nth(2).click()
  await expect(page).toHaveURL(/\/projects\/$/)
})

for (const theme of ['light', 'dark'] as const) {
  test(`the personal mobile opening keeps identity and primary actions in view in ${theme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const hero = page.locator('[data-home-hero]')
    const portrait = hero.getByRole('img', { name: 'Portrait of Santiago Molina, smiling' })

    await expect(hero.getByRole('link', { name: 'See selected work', exact: true })).toBeInViewport({ ratio: 1 })
    await expect(hero.getByRole('link', { name: 'Work with me', exact: true })).toBeInViewport({ ratio: 1 })
    await expect(hero.getByText('Medellín, Colombia', { exact: true })).toBeInViewport({ ratio: 1 })
    await expect(hero.getByRole('link', { name: 'Lumen UI Web and native components' })).toBeVisible()
    await expect(hero.getByRole('link', { name: 'PostLens Private photo editing for iPhone' })).toBeVisible()
    await expect(hero.getByRole('link', { name: 'Explore all projects' })).toBeVisible()
    await expect.poll(() => portrait.evaluate(image => image.getBoundingClientRect().height)).toBeLessThanOrEqual(100)
    const portraitBounds = await portrait.boundingBox()
    const headingBounds = await hero.locator('h1').boundingBox()

    expect(portraitBounds).not.toBeNull()
    expect(headingBounds).not.toBeNull()
    expect((portraitBounds?.y ?? 0) + (portraitBounds?.height ?? 0)).toBeLessThan(headingBounds?.y ?? 0)
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  test(`hero product links keep complete text and logos at enlarged sizes in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%'
        await document.fonts.ready
      })

      const products = page.getByRole('navigation', { name: 'Featured products' })

      for (const link of await products.getByRole('link').all()) {
        await expect(link).toBeVisible()
        const clipped = await link.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const range = document.createRange()

          range.selectNodeContents(element)
          return [...range.getClientRects()].some(rect => rect.width > 0 && (
            rect.left < bounds.left - 1 || rect.right > bounds.right + 1
          ))
        })

        expect(clipped).toBe(false)
        await link.focus()
        await expect(link).toHaveCSS('outline-style', 'solid')
      }

      for (const image of await products.locator('img').all()) {
        await expect(image).toBeVisible()
        await expect.poll(() => image.evaluate(
          element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
        )).toBe(true)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  })

  test(`hero remains usable at mobile, tablet, and desktop widths in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    for (const width of [320, 375, 640, 767, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      // Wait for responsive styles and fonts before measuring the resized hero.
      await page.evaluate(async () => {
        await document.fonts.ready
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve()
            })
          })
        })
      })

      const hero = page.locator('[data-home-hero]')
      const heading = hero.locator('h1')
      const action = hero.locator('a[href="/portfolio/"]')
      const bounds = await heading.boundingBox()

      expect(bounds).not.toBeNull()
      expect(bounds?.x).toBeGreaterThanOrEqual(0)
      expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
      await expect(action).toBeVisible()
      await action.focus()
      await expect(action).toBeFocused()
      await expect(hero.locator('a[href="/work-with-me/"]')).toBeVisible()
    }

    await expectNoUnexpectedAccessibilityViolations(page)

    for (const width of [320, 375, 640, 767]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(() => page.locator('.maker-hero-portrait').evaluate(
        image => image.getBoundingClientRect().height
      )).toBeLessThanOrEqual(100)
      for (const title of await page.locator('.maker-hero-project strong').all()) {
        const lineCount = await title.evaluate(element => {
          const range = document.createRange()

          range.selectNodeContents(element)

          return range.getClientRects().length
        })

        expect(lineCount).toBe(1)
      }
    }
  })
}

for (const route of ['/', '/es/']) {
  test(`hero headings and primary actions stay readable at narrow text measures on ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const layouts = [
      [320, 100, 5.1],
      [375, 100, 3.1],
      [768, 100, 3.1],
      [1440, 100, 3.1],
      [320, 200, 10.1],
      [390, 200, 10.1],
      [768, 200, 10.1],
      [1440, 200, 10.1]
    ] as const

    for (const [width, textSize, maximumLines] of layouts) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(route)
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = `${size}%`
        await document.fonts.ready
      }, textSize)
      const heading = page.locator('[data-home-hero-heading]')
      const typography = await heading.evaluate(element => {
        const range = document.createRange()
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
        const splitWords: string[] = []

        while (walker.nextNode()) {
          const node = walker.currentNode

          for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
            range.setStart(node, match.index)
            range.setEnd(node, match.index + match[0].length)
            const rectangles = [...range.getClientRects()].filter(rect => rect.width > 0)
            const lines = new Set(rectangles.map(rect => Math.round(rect.top)))

            if (lines.size > 1) splitWords.push(match[0])
          }
        }
        return {
          splitWords,
          lines: element.clientHeight / Number.parseFloat(getComputedStyle(element).lineHeight)
        }
      })

      expect(typography.splitWords, `${width}px at ${textSize}%`).toEqual([])
      expect(typography.lines).toBeLessThan(maximumLines)
      const action = page.locator('[data-home-hero] .maker-hero-primary')
      const fits = await action.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        const range = document.createRange()

        range.selectNodeContents(element)
        return [...range.getClientRects()].every(rect => rect.width === 0 || (
          rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
        ))
      })

      expect(fits, `${width}px at ${textSize}%`).toBe(true)
      await action.focus()
      await expect(action).toBeInViewport()
      await expect(action).toHaveCSS('outline-style', 'solid')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  })
}

for (const route of ['/', '/es/']) {
  test(`product evidence stays clear of the headline and follows the actions on ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      const scene = page.locator('[data-home-product-scene]')

      await expect(scene.locator('[data-home-product-stage] a, [data-home-product-stage] button')).toHaveCount(0)
      await expect(scene.locator('[data-film-open]')).toBeVisible()
      await expect(scene.locator('figcaption')).toContainText(route === '/' ? 'sample content' : 'contenido de ejemplo')
      await expect(scene.locator('img')).toHaveCount(2)
      for (const image of await scene.locator('img').all()) {
        await expect(image).toBeVisible()
        await expect.poll(() => image.evaluate(element => (
          element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
        ))).toBe(true)
      }
      const geometry = await scene.evaluate(element => {
        const sceneBounds = element.getBoundingClientRect()
        const heading = document.querySelector('[data-home-hero-heading]')
        const actions = document.querySelector('[data-home-hero] .maker-hero-actions')
        const spans = heading ? [...heading.children] : []
        const range = document.createRange()
        const lines = spans.map(span => {
          range.selectNodeContents(span)
          const bounds = range.getBoundingClientRect()

          return { right: bounds.right, bottom: bounds.bottom }
        })

        return {
          sceneLeft: sceneBounds.left,
          sceneTop: sceneBounds.top,
          sceneRight: sceneBounds.right,
          actionBottom: actions?.getBoundingClientRect().bottom ?? Infinity,
          lines
        }
      })

      expect(geometry.lines).toHaveLength(3)
      expect(geometry.lines.every(line => (
        line.bottom < geometry.sceneTop || line.right < geometry.sceneLeft
      ))).toBe(true)
      expect(geometry.sceneTop > geometry.actionBottom).toBe(width < 1280)
      expect(geometry.sceneRight).toBeLessThanOrEqual(width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  })
}

test('the opening stays opaque during its finite entrance and rests on return navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const hero = page.locator('[data-home-hero]')
  const samples = await hero.evaluate(async element => {
    const samples: { visible: boolean, endTimes: number[] }[] = []
    const start = performance.now()

    while (performance.now() - start < 850) {
      const animated = element.getAnimations({ subtree: true })
      const content = [...element.querySelectorAll('h1 > span, .maker-hero-description, .maker-hero-actions, [data-hero-plate]')]

      samples.push({
        visible: content.every(node => getComputedStyle(node).opacity === '1' && node.checkVisibility()),
        endTimes: animated.map(animation => Number(animation.effect?.getComputedTiming().endTime ?? 0))
      })
      await new Promise<void>(resolve => requestAnimationFrame(() => {
        resolve()
      }))
    }
    return samples
  })

  expect(samples.length).toBeGreaterThan(1)
  expect(samples.every(sample => sample.visible)).toBe(true)
  expect(samples.flatMap(sample => sample.endTimes).every(time => time <= 800)).toBe(true)
  await expect.poll(() => hero.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
  await hero.getByRole('link', { name: 'See selected work', exact: true }).click()
  await expect(page).toHaveURL(/\/portfolio\/$/u)
  await page.goBack()
  await expect(page.locator('body')).toHaveAttribute('data-client-navigation')
  await expect(hero.locator('h1')).toBeVisible()
  // Browser-managed color transitions may still settle after the document swap;
  // the one-time opening must not replay.
  const returnedAnimations = await hero.evaluate(element => element.getAnimations({ subtree: true })
    .filter((animation): animation is CSSAnimation => animation instanceof CSSAnimation)
    .map(animation => animation.animationName))

  expect(returnedAnimations).toEqual([])
})

test('reduced motion keeps the opening still and product focus highlights the corresponding preview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const hero = page.locator('[data-home-hero]')

  expect(await hero.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
  const crop = hero.locator('[data-hero-workspace-crop]')
  const initialBorder = await crop.evaluate(element => getComputedStyle(element).borderTopColor)

  await hero.locator('[data-hero-link="lumen-ui"]').focus()
  await expect(crop).not.toHaveCSS('border-top-color', initialBorder)
  await hero.locator('[data-hero-link="postlens"]').focus()
  await expect(hero.locator('[data-hero-plate="postlens"]')).toHaveCSS('outline-style', 'solid')
  await expect(crop).toHaveCSS('border-top-color', initialBorder)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/portfolio\/postlens\/$/u)
})

test('product previews and primary destinations work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  try {
    await page.goto('/')
    const hero = page.locator('[data-home-hero]')

    await expect(hero.locator('h1')).toBeVisible()
    await expect.poll(() => hero.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
    await hero.locator('[data-home-product-scene]').scrollIntoViewIfNeeded()
    for (const image of await hero.locator('[data-home-product-scene] img').all()) {
      await expect(image).toBeVisible()
      await expect.poll(() => image.evaluate(element => (
        element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
      ))).toBe(true)
    }
    await hero.getByRole('link', { name: 'Work with me', exact: true }).click()
    await expect(page).toHaveURL(/\/work-with-me\/$/u)
  } finally {
    await context.close()
  }
})
