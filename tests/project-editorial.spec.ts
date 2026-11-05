import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const content = path.resolve('src/content/project')
const publishedProjects = readdirSync(content).filter(id => !/^draft:\s*true\s*$/mu.test(readFileSync(path.join(content, id, 'index.mdx'), 'utf8')))
const representativeProjects = ['postlens', 'datagran', 'tedx-medellin', 'eslint-config-santi020k', 'lumen-ui', 'smith-commerce']

const outcomeName = (project: string) => project === 'tedx-medellin' ? 'Outcome summary' : 'Outcomes'

const openContents = async (page: Page) => {
  const mobile = page.locator('[data-project-mobile-toc]:visible')

  if (await mobile.count()) await mobile.locator('[data-toc-summary]').press('Enter')
  const navigation = page.locator('[data-project-mobile-toc]:visible, [data-project-desktop-toc]:visible')
  const chapter = navigation.locator('details').filter({ has: page.locator('a[href="#outcomes"], a[href="#outcome-summary"]') }).last()

  if (await chapter.count() && await chapter.getAttribute('open') === null) await chapter.locator('summary').press('Enter')

  return navigation
}

test('every published project exposes one opening and navigable outcome evidence', async ({ page }) => {
  for (const project of publishedProjects) {
    await page.goto(`/portfolio/${project}/`)
    const lead = page.locator('[data-project-context-lead]')
    const outcomes = page.locator('[data-project-outcomes]')

    await expect(lead).toHaveCount(1)
    await expect(lead.locator('h2')).toHaveCount(1)
    await expect(page.locator('[data-content-notes]')).toHaveCount(0)
    await expect(outcomes).toHaveCount(1)
    const headingId = await outcomes.locator('h3').getAttribute('id') ?? ''

    await expect(page.locator(`[data-project-desktop-toc] a[href="#${headingId}"]`)).toHaveCount(1)
    await expect(page.locator(`[data-project-mobile-toc] a[href="#${headingId}"]`)).toHaveCount(1)
    expect(await outcomes.locator('[data-outcome-trail] a').count()).toBeGreaterThanOrEqual(2)
    const problems = await page.locator('.prose-project').evaluate(story => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id)
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
      const broken = [...story.querySelectorAll('a[href^="#"]')].flatMap(link => {
        const href = link.getAttribute('href') ?? ''

        return document.getElementById(decodeURIComponent(href.slice(1))) ? [] : [href]
      })
      const unstyledHeadings = [...story.querySelectorAll(':scope > h3')].map(heading => heading.id)

      return { duplicates, broken, unstyledHeadings }
    })

    expect(problems, project).toEqual({ duplicates: [], broken: [], unstyledHeadings: [] })
  }
})

for (const javaScriptEnabled of [true, false]) {
  test(`shared outcome chapters and context trails work with JavaScript ${javaScriptEnabled}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' })
    const page = await context.newPage()

    try {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        for (const project of ['postlens', 'tedx-medellin', 'smith-commerce']) {
          await page.goto(`/portfolio/${project}/`)
          const navigation = await openContents(page)
          const label = outcomeName(project)
          const link = navigation.getByRole('link', { name: label, exact: true })

          await link.focus()
          await expect(link).not.toHaveCSS('outline-style', 'none')
          await link.press('Enter')
          const heading = page.locator('[data-project-outcomes] h3')

          await expect(heading).toBeInViewport()
          const trail = page.locator('[data-outcome-trail] a').first()
          const destination = await trail.getAttribute('href') ?? ''

          await trail.focus()
          await trail.press('Enter')
          await expect(page).toHaveURL(new RegExp(`${destination}$`, 'u'))
          await expect(page.locator(destination)).toBeInViewport()
          await page.goto(`/portfolio/${project}/#sidebar-outcomes`)
          await expect(heading).toBeInViewport()
        }
      }
    } finally {
      await context.close()
    }
  })
}

for (const theme of ['light', 'dark']) {
  test(`shared editorial compositions reflow and remain accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    for (const project of representativeProjects) {
      await page.goto(`/portfolio/${project}/`)
      await page.evaluate(() => document.fonts.ready)
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        for (const size of [100, 200]) {
          await page.evaluate(value => {
            document.documentElement.style.fontSize = `${value}%`
          }, size)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${project} ${width} ${size}`).toBe(true)
          const clipped = await page.locator('[data-project-context-lead] h2, [data-project-section-heading] h3, [data-project-intent] p, [data-project-capability], [data-architecture-notes] dd, [data-principle-lead]').evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent))

          expect(clipped, `${project} ${width} ${size}`).toEqual([])
        }
      }
      await page.setViewportSize({ width: 390, height: 1000 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '100%'
      })
      const audit = await new AxeBuilder({ page }).include('.prose-project').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

      expect(audit.violations, project).toEqual([])
    }
  })
}

test('shared compositions retain inline code, resource links and product qualifications', async ({ page }) => {
  await page.goto('/portfolio/postlens/')
  await expect(page.locator('[data-project-context-lead]')).toContainText('Instagram account connection and direct publishing remain unavailable while we await Meta approval for production')
  await expect(page.locator('.prose-project')).toContainText('Instagram connection and direct publishing are not available in the production app')
  await expect(page.locator('[data-project-capabilities] li')).toHaveCount(7)
  await expect(page.locator('[data-project-intent] li')).toHaveCount(4)
  await expect(page.locator('[data-architecture-notes] code')).toHaveText(['SwiftUI', 'PhotoKit', 'PhotosPicker', 'Vision', 'Core Image', 'StoreKit'])
  await page.goto('/portfolio/dep-beacon/')
  await expect(page.locator('[data-project-intent] code')).toHaveText(['^', '~'])
  await page.goto('/portfolio/auth/')
  const packageLink = page.locator('#project-return a[href="https://www.npmjs.com/package/@santi020k/auth-cloudflare"]')

  await expect(packageLink).toHaveCount(1)
  await expect(packageLink).toHaveAttribute('rel', /noopener noreferrer/u)
  await expect(page.locator('.prose-project')).toContainText('experimental')
  await page.goto('/portfolio/roadscore/')
  await expect(page.locator('#project-return a[href="https://roadscore.santi020k.com/app/"]')).toHaveCount(1)
  await expect(page.locator('.prose-project')).toContainText('The iPhone and iPad release remains in preparation.')
})
