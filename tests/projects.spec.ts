import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const width of [320, 375, 768, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`projects remain usable at ${width}px in ${theme} mode`, async ({ page: screen }) => {
      await screen.setViewportSize({ height: 900, width })
      await screen.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await screen.goto('/projects/')

      await expect(screen.getByRole('heading', { level: 1 })).toHaveText('Built for the love of it.')
      await expect(screen.locator('html')).toHaveAttribute('data-theme', `santi020k-${theme}`)
      const projects = screen.locator('[data-project-gallery-card]')
      expect(await projects.count()).toBeGreaterThan(1)

      const explore = screen.locator('[data-projects-page]').getByRole('navigation', { name: 'Browse projects by purpose' }).getByRole('link', { name: /Developer tools/u })
      await explore.focus()
      await expect(explore).toBeFocused()
      await screen.keyboard.press('Enter')
      await expect(screen).toHaveURL(/\/projects\/#developer-tools$/)

      const project = projects.first().getByRole('link', { name: 'Read the case study: Lumen UI', exact: true })
      await project.focus()
      await expect(project).toBeFocused()
      await expect(project).toHaveAttribute('href', /\/portfolio\/.+\/$/)
      const image = projects.first().locator('img')
      await expect.poll(() => image.evaluate(element => (
        element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
      ))).toBe(true)

      expect(await screen.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await expectNoUnexpectedAccessibilityViolations(screen)
      await screen.keyboard.press('Enter')
      await expect(screen).toHaveURL(/\/portfolio\/.+\/$/)
      await expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`Project chapter links with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
    test.use({ javaScriptEnabled })

    test('connect category headings with accurate counts and keyboard-operable fragments', async ({ page }) => {
      await page.setViewportSize({ height: 900, width: 320 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/projects/#developer-tools')
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })

      const categories = [
        { id: 'developer-tools', title: 'Developer tools' },
        { id: 'apps', title: 'Apps' },
        { id: 'experiments', title: 'Experiments' }
      ]
      for (const category of categories) {
        const navigation = page.getByRole('navigation', { name: `Explore beyond ${category.title}` })
        await expect(navigation.getByRole('link')).toHaveCount(categories.length - 1)
        for (const destination of categories.filter(item => item.id !== category.id)) {
          const count = await page.locator(`#${destination.id} [data-project-gallery-card]`).count()
          const link = navigation.getByRole('link', { name: `${destination.title} ${count} ${count === 1 ? 'project' : 'projects'}`, exact: true })
          await expect(link).toHaveAttribute('href', `#${destination.id}`)
          await expect(link).not.toHaveAttribute('target', '_blank')
          expect(await link.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
        }
      }

      for (const [from, to] of [['Developer tools', 'apps'], ['Apps', 'experiments'], ['Experiments', 'developer-tools']] as const) {
        const link = page.getByRole('navigation', { name: `Explore beyond ${from}` }).locator(`a[href="#${to}"]`)
        await link.focus()
        await expect(link).toBeFocused()
        await expect(link).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`/projects/#${to}$`, 'u'))
        await expect(page.locator(`#${to}`)).toBeFocused()
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    })
  })
}

test('product-first cards keep concise copy and distinguish the website from the case study', async ({ page: screen }) => {
  await screen.goto('/projects/')
  const postlens = screen.locator('[data-project-gallery-card]').filter({
    has: screen.getByRole('heading', { name: 'PostLens', exact: true })
  })
  const project = postlens.getByRole('link', { name: 'Read the case study: PostLens', exact: true })
  await expect(postlens.getByRole('link')).toHaveCount(2)
  await expect(postlens.getByRole('link', { name: 'Visit PostLens', exact: true })).toHaveAttribute('href', 'https://postlens.santi020k.com/')
  await expect(project).toHaveAttribute('href', '/portfolio/postlens/')
  await expect(postlens.locator('p')).toHaveText(
    'A private photo studio for iPhone and iPad. Choose your best shots, refine them, and compose layouts ready to share.'
  )
  await expect(postlens.getByRole('list', { name: 'Core technologies' }).getByRole('listitem')).toHaveText([
    'Swift', 'SwiftUI', 'iOS'
  ])
  await expect(postlens.locator('[data-site-pill]')).toHaveText('Active')
  // Keep titles and technology labels in accessible HTML, outside the artwork.
  await expect(postlens.locator('img')).toHaveAttribute('src', /cover-horizontal/u)
  await expect(postlens.locator('img')).toHaveAttribute('alt', '')

  // Keep the complete case-study description independent of its short gallery copy.
  await project.click()
  await expect(screen.locator('meta[name="description"]')).toHaveAttribute('content', /Built a private visual content studio for iPhone and iPad/)
})

test('editorial project cards retain their full text and link at enlarged mobile text sizes', async ({ page: screen }) => {
  await screen.setViewportSize({ width: 390, height: 844 })
  await screen.emulateMedia({ reducedMotion: 'reduce' })
  await screen.goto('/projects/')
  await screen.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })

  const card = screen.locator('[data-project-gallery-card]').filter({
    has: screen.getByRole('heading', { name: 'Between Contractions', exact: true })
  })
  const project = card.getByRole('link', { name: 'Read the case study: Between Contractions', exact: true })
  await project.focus()
  await expect(project).toBeFocused()
  await expect(card.getByRole('heading')).toHaveText('Between Contractions')
  await expect(card.locator('p')).toHaveText(
    'A calm, private contraction timer. Track each contraction, review your rhythm, and share the moment with your partner.'
  )
  const layout = await project.evaluate(element => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      overflows: element.scrollWidth > element.clientWidth,
      right: box.right,
      viewport: document.documentElement.clientWidth
    }
  })
  expect(layout.overflows).toBe(false)
  expect(layout.right).toBeLessThanOrEqual(layout.viewport)
  expect(layout.outlineStyle).toBe('solid')
  expect(layout.outlineWidth).toBeGreaterThanOrEqual(2)
  expect(await screen.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await screen.keyboard.press('Enter')
  await expect(screen).toHaveURL(/\/portfolio\/between-contractions\/$/)
})

test('product-first destinations open a protected new tab and missing destinations retain a case study', async ({ page, context }) => {
  await page.goto('/projects/')
  const destinations = page.locator('[data-project-visit]')
  await expect(destinations).toHaveCount(13)
  for (const destination of await destinations.all()) {
    await expect(destination).toHaveAttribute('target', '_blank')
    const rel = (await destination.getAttribute('rel'))?.split(/\s+/u) ?? []
    expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
  }
  const caseStudies = page.locator('[data-project-case-study]')
  await expect(caseStudies).toHaveCount(14)
  for (const caseStudy of await caseStudies.all()) {
    await expect(caseStudy).not.toHaveAttribute('target', '_blank')
  }
  await expect(page.locator('[data-project-gallery-card] a a')).toHaveCount(0)
  const coolstead = page.locator('[data-project-gallery-card]').filter({
    has: page.getByRole('heading', { name: 'Coolstead', exact: true })
  })
  await expect(coolstead.getByRole('link')).toHaveCount(1)
  await expect(coolstead.getByRole('link')).toHaveAttribute('href', '/portfolio/coolstead/')

  await context.route('https://lumen.santi020k.com/', route => route.fulfill({
    contentType: 'text/html',
    body: '<title>Lumen destination test</title>'
  }))
  const visit = page.getByRole('link', { name: 'Visit Lumen UI', exact: true })
  await visit.focus()
  await expect(visit).toHaveCSS('outline-style', 'solid')
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.keyboard.press('Enter')
  ])
  await popup.waitForLoadState('domcontentloaded')
  await expect(popup).toHaveURL('https://lumen.santi020k.com/')
  expect(await popup.evaluate(() => window.opener === null)).toBe(true)
  await popup.close()
  await expect(page).toHaveURL(/\/projects\/$/u)
})
