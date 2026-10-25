import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

const LONG_ARTICLE = '/blog/run-repo-on-mac-with-silo-dxmt/'
const LONG_TITLE_ARTICLE = '/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/'

const openContents = async (page: Page) => {
  const opener = page.locator('[data-project-mobile-toc] summary, [data-post-mobile-toc] summary')

  if (await opener.isVisible()) await opener.click()

  return page.getByRole('navigation', { name: 'Table of contents', exact: true })
}

// Apply the user's text-size preference before first layout. Changing rem units
// mid-render can leave offscreen geometry stale when native focus scrolls it.
const openWithEnlargedText = async (page: Page, route: string, fontSize = '200%') => {
  await page.addInitScript(size => {
    const applyPreference = () => {
      const root = document.querySelector('html')

      if (!root) return false

      root.style.fontSize = size

      return true
    }

    if (!applyPreference()) {
      const observer = new MutationObserver(() => {
        if (applyPreference()) observer.disconnect()
      })

      observer.observe(document, { childList: true })
    }
  }, fontSize)
  await page.goto(route)
  await expect(page.locator('html')).toHaveCSS('font-size', `${16 * parseFloat(fontSize) / 100}px`)
}

const settleLayout = async (page: Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].filter(image => image.loading === 'eager').map(image => image.decode()))
    // Rem-based container queries can settle after the font-size change's first
    // paint. Read layout until it stabilizes before asking native focus to scroll.
    await new Promise<void>((resolve, reject) => {
      let previousHeight = -1
      let stableFrames = 0
      let frames = 0

      const sample = () => {
        const height = document.documentElement.getBoundingClientRect().height

        stableFrames = height === previousHeight ? stableFrames + 1 : 0
        previousHeight = height
        frames += 1

        if (stableFrames >= 3) {
          resolve()
        } else if (frames >= 30) {
          reject(new Error('Responsive layout did not settle'))
        } else {
          requestAnimationFrame(sample)
        }
      }

      requestAnimationFrame(sample)
    })
  })
}

const navigateWithClientRouter = async (page: Page, link: Locator, pathname: string) => {
  // Astro updates the URL before destination scripts and page-load handlers finish.
  await Promise.all([
    page.evaluate(destination => new Promise<void>(resolve => {
      const onPageLoad = () => {
        if (location.pathname !== destination) return

        document.removeEventListener('astro:page-load', onPageLoad)
        resolve()
      }

      document.addEventListener('astro:page-load', onPageLoad)
    }), pathname),
    link.click()
  ])
}

const expectWithinScreen = async (locator: Locator) => {
  const outside = await locator.evaluateAll(elements => elements.flatMap(element => {
    const bounds = element.getBoundingClientRect()

    return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1) ?
      [{ text: element.textContent.trim(), left: bounds.left, right: bounds.right }] :
      []
  }))

  expect(outside).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Responsive reading in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('the phone homepage hero reflows enlarged copy and project links', async ({ page }) => {
      await openWithEnlargedText(page, '/')

      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 900 })
        await settleLayout(page)
        await expectWithinScreen(page.locator('[data-home-hero] h1, [data-home-hero] p, [data-home-hero] a, [data-home-hero] img'))
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/I build products\.\s*And the tools\s*behind them\./u)
        const action = page.getByRole('link', { name: 'Explore my work', exact: true })

        await action.focus()
        await expect(action).toBeInViewport({ ratio: 1 })
      }
    })

    test('the default tablet and desktop hero keeps the portrait beside its copy', async ({ page }) => {
      await page.goto('/')

      for (const width of [768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await settleLayout(page)

        const separateColumns = await page.locator('[data-home-hero-heading]').evaluate(heading => {
          const title = heading.getBoundingClientRect()
          const portrait = document.querySelector('.maker-hero-portrait-frame')?.getBoundingClientRect()

          return portrait !== undefined && title.right <= portrait.left &&
            title.top < portrait.bottom && title.bottom > portrait.top
        })

        expect(separateColumns).toBe(true)
      }
    })

    test('the tablet and desktop hero keeps enlarged words clear of the portrait', async ({ page }) => {
      await openWithEnlargedText(page, '/')

      for (const width of [768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await settleLayout(page)

        const readable = await page.locator('[data-home-hero-heading]').evaluate(heading => {
          const title = heading.getBoundingClientRect()
          const portrait = document.querySelector('.maker-hero-portrait-frame')?.getBoundingClientRect()
          const firstLine = heading.querySelector('span')?.firstChild

          if (!portrait || !firstLine?.textContent) return false

          const start = firstLine.textContent.indexOf('products.')

          if (start < 0) return false

          const range = document.createRange()

          range.setStart(firstLine, start)
          range.setEnd(firstLine, start + 'products.'.length)
          const wordFits = range.getClientRects().length === 1
          const separate = title.right <= portrait.left || title.bottom <= portrait.top

          return wordFits && separate
        })

        expect(readable).toBe(true)
        await expectWithinScreen(page.locator('[data-home-hero] h1, [data-home-hero] a, [data-home-hero] img'))
      }
    })

    for (const size of ['100%', '125%', '150%', '200%']) {
      test(`the reading marker follows native scrolling at ${size} text`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await openWithEnlargedText(page, LONG_ARTICLE, size)
        await settleLayout(page)
        const navigation = await openContents(page)

        for (const fragment of ['troubleshooting-notes', 'what-you-need']) {
          await page.locator(`#${fragment}`).evaluate(heading => {
            heading.scrollIntoView({ block: 'start' })
          })
          const link = navigation.locator(`a[href="#${fragment}"]`)

          await expect.poll(() => page.locator(`#${fragment}`).evaluate(heading => {
            const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)

            return Math.abs(heading.getBoundingClientRect().top - padding)
          })).toBeLessThanOrEqual(1)
          await expect(link).toHaveAttribute('aria-current', 'location')
          await expect(navigation.locator('[aria-current="location"]')).toHaveCount(1)
        }
      })
    }

    test('the reading marker remains visible in forced colors', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' })

      for (const route of [LONG_ARTICLE, '/portfolio/smith-commerce/']) {
        await page.goto(route)
        await settleLayout(page)
        const navigation = await openContents(page)
        const destination = navigation.getByRole('link').nth(1)

        await destination.focus()
        await page.keyboard.press('Enter')
        await expect(destination).toHaveAttribute('aria-current', 'location')
        await expect.poll(() => destination.evaluate(link => parseFloat(getComputedStyle(link, '::before').borderInlineStartWidth))).toBeGreaterThanOrEqual(2)

        const marker = await destination.evaluate(link => {
          const style = getComputedStyle(link, '::before')

          return { color: style.borderInlineStartColor, style: style.borderInlineStartStyle }
        })
        const background = await navigation.evaluate(element => getComputedStyle(element).backgroundColor)

        expect(marker.style).toBe('solid')
        expect(marker.color).not.toBe(background)
      }
    })

    test('the reading marker honors native percentage padding and heading margins', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(LONG_ARTICLE)
      await page.addStyleTag({ content: 'html { scroll-padding-top: 25%; } #troubleshooting-notes { scroll-margin-top: 12px; }' })
      await settleLayout(page)
      await page.locator('#troubleshooting-notes').evaluate(heading => {
        heading.scrollIntoView({ block: 'start' })
      })
      await expect(page.getByRole('navigation', { name: 'Table of contents', exact: true }).locator('a[href="#troubleshooting-notes"]')).toHaveAttribute('aria-current', 'location')
      await expect.poll(() => page.locator('#troubleshooting-notes').evaluate(heading => Math.abs(heading.getBoundingClientRect().top - 237))).toBeLessThanOrEqual(1)
    })

    for (const width of [390, 1440]) {
      for (const fontSize of ['125%', '150%', '200%']) {
        test(`the reading marker rebinds after client navigation at ${width}px with ${fontSize} text`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 })
          await page.goto(LONG_ARTICLE)
          const initialDocument = await page.evaluateHandle(() => document)
          await navigateWithClientRouter(page, page.getByRole('link', { name: 'santi020k — Santiago Molina home' }), '/')
          await expect(page).toHaveURL(/\/$/u)
          await navigateWithClientRouter(page, page.locator('[data-home-hero] a[href="/portfolio/lumen-ui/"]'), '/portfolio/lumen-ui/')
          await expect(page).toHaveURL(/\/portfolio\/lumen-ui\/$/u)
          // Document identity proves a client swap without timestamp precision differences.
          expect(await initialDocument.evaluate(node => node === document)).toBe(true)
          await initialDocument.dispose()
          await page.evaluate(size => {
            document.documentElement.style.fontSize = size
          }, fontSize)
          await settleLayout(page)
          await expect(page.locator('[data-reading-layout]')).toHaveCSS('font-size', `${16 * parseFloat(fontSize) / 100}px`)
          // Header padding must resize with the text before a fragment target is measured.
          expect(await page.locator('.site-header').evaluate(header => parseFloat(getComputedStyle(header).paddingTop)))
            .toBe(24 * parseFloat(fontSize) / 100)
          const navigation = await openContents(page)
          const link = navigation.locator('a[href="#technical-highlights"]')
          const initialTargetTop = await page.locator('#technical-highlights').evaluate(heading => heading.getBoundingClientRect().top + scrollY)

          await link.focus()
          await page.keyboard.press('Enter')
          await expect.poll(() => page.locator('#technical-highlights').evaluate(heading => {
            const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)

            return Math.abs(heading.getBoundingClientRect().top - padding)
          })).toBeLessThanOrEqual(1)
          await expect.poll(() => page.locator('#technical-highlights').evaluate(heading => heading.getBoundingClientRect().top + scrollY)).toBeCloseTo(initialTargetTop, 0)
          await expect(link).toHaveAttribute('aria-current', 'location')
          await expect(navigation.locator('[aria-current="location"]')).toHaveCount(1)
        })
      }
    }

    test('narrow enlarged table-of-contents links retain their complete text and native navigation', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 1000 })
      await openWithEnlargedText(page, '/blog/why-developer-experience-work-should-be-measured-like-product-work/')
      await settleLayout(page)
      const navigation = await openContents(page)
      const clipped = await navigation.getByRole('link').evaluateAll(links => links.flatMap(link => {
        const box = link.getBoundingClientRect()
        const range = document.createRange()

        range.selectNodeContents(link)
        return [...range.getClientRects()].some(rect => rect.left < box.left - 1 || rect.right > box.right + 1) ?
          [link.textContent] :
          []
      }))

      expect(clipped).toEqual([])
      const destination = navigation.getByRole('link', { name: 'Measurement does not require a big system', exact: true })

      await destination.focus()
      await page.keyboard.press('Enter')
      await expect(destination).toHaveAttribute('aria-current', 'location')
      await expect(page.getByRole('heading', { name: 'Measurement does not require a big system', exact: true })).toBeInViewport()
    })

    test('history previews and long actions fit narrow screens and enlarged text', async ({ page }) => {
      await page.goto('/history/')

      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, fontSize)

        for (const width of [320, 375, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 })
          await settleLayout(page)
          await expectWithinScreen(page.locator('.history-hero-print'))
          await expectWithinScreen(page.locator('.history-era-actions a'))

          const previewsFit = await page.locator('.history-hero-exhibit').evaluate(async element => {
            const exhibit = element.getBoundingClientRect()
            const images = [...element.querySelectorAll('img')]

            await Promise.all(images.map(image => image.decode()))

            const captionsFit = [...element.querySelectorAll('figcaption span')].every(caption => caption.scrollWidth <= caption.clientWidth + 1)

            const imagesFit = images.length === 3 && images.every(image => {
              const bounds = image.getBoundingClientRect()

              return bounds.left >= exhibit.left - 1 && bounds.right <= exhibit.right + 1 &&
                Math.abs(bounds.width / bounds.height - image.naturalWidth / image.naturalHeight) < 0.01
            })

            return element.scrollWidth <= element.clientWidth + 1 && captionsFit && imagesFit
          })

          expect(previewsFit, 'All three complete captures and their captions fit inside the hero exhibit').toBe(true)
        }
      }
    })

    test('long article titles and native cover art remain readable', async ({ page }) => {
      await page.goto(LONG_TITLE_ARTICLE)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Configuring MongoDB')
      await expect(page.locator('[data-post-cover-caption]')).toHaveCount(0)

      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, fontSize)

        for (const width of [320, 375, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 })
          await settleLayout(page)

          const cover = page.locator('[data-post-cover] img')
          await expectWithinScreen(cover)
          const imageIsIntact = await cover.evaluate(image => {
            if (!(image instanceof HTMLImageElement)) return false
            const bounds = image.getBoundingClientRect()
            return image.complete && image.naturalWidth > 0 &&
              Math.abs(bounds.width / bounds.height - image.naturalWidth / image.naturalHeight) < 0.01
          })
          expect(imageIsIntact).toBe(true)

          await expectWithinScreen(page.getByRole('heading', { level: 1 }))
        }
      }
    })

    for (const { route, fragment, label } of [
      { route: LONG_ARTICLE, fragment: 'troubleshooting-notes', label: 'article' },
      { route: '/portfolio/lumen-ui/', fragment: 'technical-highlights', label: 'project' }
    ]) {
      test(`${label} reading layout yields space to enlarged text at tablet widths`, async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 900 })
        await openWithEnlargedText(page, route)
        await settleLayout(page)

        const comfortable = await page.locator('.prose-santi').evaluate(prose => {
          const bounds = prose.getBoundingClientRect()
          const article = prose.closest('article')?.getBoundingClientRect()
          const rail = prose.closest('article')?.querySelector('[data-reading-rail]')?.getBoundingClientRect()
          const opener = prose.closest('article')?.querySelector('[data-post-mobile-toc]')?.getBoundingClientRect()

          return article !== undefined && rail !== undefined &&
            bounds.width >= article.width * 0.8 && (opener ?
            opener.height > 0 && opener.bottom <= bounds.top && rail.width === 0 :
            rail.top >= bounds.bottom)
        })

        expect(comfortable).toBe(true)
      })

      test(`${label} metadata labels remain whole with enlarged text`, async ({ page }) => {
        await openWithEnlargedText(page, route)

        for (const width of [320, 375, 768]) {
          await page.setViewportSize({ width, height: 900 })
          await settleLayout(page)

          const lines = await page.locator('[data-editorial-meta-group] dt').evaluateAll(labels => labels.map(label => {
            const range = document.createRange()

            range.selectNodeContents(label)

            return range.getClientRects().length
          }))

          expect(lines.length).toBeGreaterThan(0)
          expect(lines.every(count => count === 1)).toBe(true)
        }
      })

      for (const width of [375, 1440]) {
        for (const enlarged of [false, true]) {
          const openPage = enlarged ?
            openWithEnlargedText :
            async (page: Page, route: string) => {
              await page.goto(route)
            }

          test(`${enlarged ? 'Enlarged' : 'Default'} ${label} fragment navigation clears the header and marks the destination at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 })
            await openPage(page, `${route}#${fragment}`)
            await settleLayout(page)

            const expectHeadingClear = async () => {
              await expect.poll(() => page.locator(`#${fragment}`).evaluate(element => {
                const heading = element.getBoundingClientRect()
                const header = document.querySelector('[data-header-shell]')?.getBoundingClientRect()

                return header !== undefined && heading.top >= header.bottom && heading.bottom <= innerHeight
              })).toBe(true)
            }

            await expectHeadingClear()
            const navigation = await openContents(page)
            const link = navigation.locator(`a[href="#${fragment}"]`)

            await link.focus()
            await page.keyboard.press('Enter')
            await expectHeadingClear()
            await expect(link).toHaveAttribute('aria-current', 'location')
          })
        }
      }
    }

    test('long desktop navigation exposes the last link and its complete focus outline', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 700 })
      await page.goto(LONG_ARTICLE)
      await settleLayout(page)
      await page.locator('.prose-santi h2').nth(2).scrollIntoViewIfNeeded()
      await page.evaluate(() => {
        scrollBy(0, 300)
      })

      const rail = page.getByRole('complementary', { name: 'Article navigation' })
      const first = rail.locator('[data-toc-tree] a').first()
      const last = rail.locator('[data-toc-tree] a').last()

      await first.focus()
      await page.keyboard.press('Tab')
      await last.focus()
      await expect(last).toBeFocused()
      await expect(last).toBeInViewport({ ratio: 1 })
      await expect.poll(() => rail.evaluate(element => element.scrollTop)).toBeGreaterThan(0)

      const outlineVisible = await last.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        const container = element.closest('aside')?.getBoundingClientRect()
        const style = getComputedStyle(element)
        const outset = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)

        return container !== undefined && style.outlineStyle === 'solid' &&
          bounds.left - outset >= container.left && bounds.right + outset <= container.right &&
          bounds.top - outset >= container.top && bounds.bottom + outset <= container.bottom
      })

      expect(outlineVisible).toBe(true)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#references$/u)
      await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeInViewport()

      const scan = await new AxeBuilder({ page }).include('[aria-label="Article navigation"]').analyze()

      expect(scan.violations).toEqual([])
    })

    test.describe('Desktop rail scrolling', () => {
      // This mouse-wheel interaction requires a desktop context, including WebKit.
      test.use({ isMobile: false })

      test('project details can be scrolled in a short desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 600 })
        await page.goto('/portfolio/lumen-ui/')
        await settleLayout(page)
        await page.getByRole('heading', { name: 'What Lumen 4 brings together' }).scrollIntoViewIfNeeded()

        const rail = page.getByRole('complementary', { name: 'Project details' })

        await rail.hover()
        await page.mouse.wheel(0, 2000)
        await expect.poll(() => rail.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
        await expect(rail.getByRole('region', { name: 'Focus', exact: true }).locator('dd').last()).toBeInViewport({ ratio: 1 })
        await expectWithinScreen(rail)
      })
    })

    test('the floating Top control leaves the footer source link clickable', async ({ page }) => {
      await page.goto('/blog/')

      for (const width of [375, 640, 768, 820, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        for (const textSize of [100, 200]) {
          await page.evaluate(size => {
            document.documentElement.style.fontSize = `${size}%`
          }, textSize)
          await settleLayout(page)
          await page.evaluate(() => {
            scrollTo(0, document.documentElement.scrollHeight)
          })
          await expect(page.locator('#back-to-top')).toHaveClass(/is-visible/u)

          const source = page.getByRole('link', { name: /Website source/u })

          await source.click({ trial: true })
          const clear = await source.evaluate(element => {
            const link = element.getBoundingClientRect()
            const top = document.querySelector('#back-to-top')?.getBoundingClientRect()

            return top !== undefined && (link.right <= top.left || link.left >= top.right ||
              link.bottom <= top.top || link.top >= top.bottom)
          })

          expect(clear, `${width}px at ${textSize}% text`).toBe(true)
        }
      }
    })

    test('technology labels and counts reflow with enlarged text', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 })
      await openWithEnlargedText(page, '/technologies/')
      await settleLayout(page)
      await expectWithinScreen(page.locator('[data-technology-group], [data-technology-item], [data-technology-label], [data-technology-project-count]'))
      await page.getByLabel('Find a technology').fill('Developer Experience')

      const result = page.locator('[data-technology-item]:not([hidden]) a')

      await expect(result).toHaveCount(1)
      await expect(result).toContainText('Developer Experience (DX)')
      await result.focus()
      await expect(result).toBeInViewport({ ratio: 1 })
      await expectWithinScreen(result.locator('span'))
      await page.keyboard.press('Enter')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Developer Experience')

      await page.goto('/portfolio/lumen-ui/')
      await expect(page.locator('html')).toHaveCSS('font-size', '32px')
      await settleLayout(page)
      await expectWithinScreen(page.locator('.editorial-detail-hero [data-site-pill], .editorial-detail-hero p'))
    })

    test('resume contacts and PDF actions remain readable with enlarged text', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 })
      await openWithEnlargedText(page, '/resume/')
      await settleLayout(page)
      await expectWithinScreen(page.locator('[data-resume-shell] > div p, [data-resume-shell] > div a'))

      for (const name of ['Download 2-page resume PDF', 'Download full CV PDF']) {
        const download = page.getByRole('link', { name })

        await download.focus()
        await expect(download).toBeInViewport({ ratio: 1 })
        await expect(download).toHaveAttribute('download')
      }
    })

    test('speaking resources reflow instead of clipping at tablet widths', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await openWithEnlargedText(page, '/speaking/')
      await settleLayout(page)
      await expectWithinScreen(page.locator('[data-speaking-timeline] a'))

      const watch = page.getByRole('link', { name: 'Watch talk', exact: true }).first()

      await watch.focus()
      await expect(watch).toBeInViewport({ ratio: 1 })
    })

    for (const width of [375, 768, 1440]) {
      test(`header utilities and menu remain usable with enlarged text at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await openWithEnlargedText(page, '/')
        await settleLayout(page)
        await expectWithinScreen(page.locator('[data-header-shell] a, [data-header-shell] button'))

        const menu = page.locator('[data-mobile-nav-toggle]')

        await expect(menu).toBeVisible()
        await menu.focus()
        await page.keyboard.press('Enter')
        await expect(menu).toHaveAttribute('aria-expanded', 'true')
        await expectWithinScreen(page.locator('[data-mobile-nav-panel] a'))
        await page.keyboard.press('Escape')
        await expect(menu).toHaveAttribute('aria-expanded', 'false')
        await expect(menu).toBeFocused()
      })
    }
  })
}
