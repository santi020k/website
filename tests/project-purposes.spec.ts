import { expect, test } from '@playwright/test'
import { z } from 'astro/zod'

const publishedGroups = [
  {
    id: 'developer-tools',
    title: 'Developer tools',
    projects: ['lumen-ui', 'astro-doctor', 'dep-beacon', 'eslint-config-basic', 'eslint-config-santi020k', 'og', 'quality', 'santi020k-theme']
  },
  {
    id: 'apps',
    title: 'Apps',
    projects: ['postlens', 'between-contractions', 'roadscore', 'coolstead', 'aaronmgz']
  },
  { id: 'experiments', title: 'Experiments', projects: ['auth'] }
] as const

const collectionSchema = z.object({
  '@type': z.literal('CollectionPage'),
  mainEntity: z.object({
    numberOfItems: z.number(),
    itemListElement: z.array(z.object({ position: z.number(), url: z.url() }))
  })
})

test('purpose groups show every published personal project once and match structured data', async ({ page }) => {
  await page.goto('/projects/')
  const navigation = page.locator('[data-projects-page]').getByRole('navigation', { name: 'Browse projects by purpose' })
  await expect(navigation.getByRole('link')).toHaveCount(3)
  await expect(page.locator('[data-project-purpose-group]')).toHaveCount(3)

  for (const group of publishedGroups) {
    const section = page.getByRole('region', { name: group.title, exact: true })
    const link = navigation.locator(`a[href="#${group.id}"]`)
    await expect(link).toContainText(group.title)
    await expect(link).toContainText(String(group.projects.length))
    await expect(section.getByRole('heading', { name: group.title, level: 2 })).toBeVisible()
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(group.projects.length)
    const destinations = await section.locator('[data-project-gallery-card] > a').evaluateAll(links => (
      links.map(item => item.getAttribute('href')).sort()
    ))
    expect(destinations).toEqual(group.projects.map(id => `/portfolio/${id}/`).sort())
  }

  const cards = page.locator('[data-project-gallery-card]')
  await expect(cards).toHaveCount(14)
  await expect(cards.first().getByRole('heading')).toHaveText('Lumen UI')
  await expect(page.getByRole('heading', { name: 'Workspace Organizer', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-projects-page] .maker-hero-eyebrow')).toContainText('14 projects')

  const visibleDestinations = await cards.locator(':scope > a').evaluateAll(links => links.map(link => (
    link instanceof HTMLAnchorElement ? link.pathname : ''
  )))
  expect(new Set(visibleDestinations).size).toBe(14)
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
  const values = scripts
    .map((script): unknown => JSON.parse(script))
  const parsed = collectionSchema.parse(values.find(value => collectionSchema.safeParse(value).success))

  expect(parsed.mainEntity.numberOfItems).toBe(14)
  expect(parsed.mainEntity.itemListElement.map(item => new URL(item.url).pathname)).toEqual(visibleDestinations)
  expect(parsed.mainEntity.itemListElement.every(item => new URL(item.url).origin === 'https://santi020k.com')).toBe(true)
  expect(parsed.mainEntity.itemListElement.map(item => item.position)).toEqual(
    Array.from({ length: 14 }, (_, index) => index + 1)
  )
})

test('purpose links support keyboard navigation and retain all projects', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/projects/')
  const links = page.getByRole('navigation', { name: 'Browse projects by purpose' }).getByRole('link')
  await links.first().focus()
  await expect(links.first()).toBeFocused()
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
  await expect(links.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/#apps$/u)
  await expect(page.getByRole('region', { name: 'Apps', exact: true })).toBeFocused()
  await expect(page.locator('[data-project-gallery-card]')).toHaveCount(14)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  test('purpose links and every project remain available', async ({ page }) => {
    await page.goto('/projects/')
    const navigation = page.locator('[data-projects-page]').getByRole('navigation', { name: 'Browse projects by purpose' })
    await navigation.getByRole('link', { name: /Experiments/u }).click()
    await expect(page).toHaveURL(/\/projects\/#experiments$/u)
    const experiment = page.getByRole('region', { name: 'Experiments', exact: true })
    await expect(experiment.getByRole('heading', { name: 'santi020k auth', level: 3 })).toBeVisible()
    await expect(page.locator('[data-project-gallery-card]')).toHaveCount(14)
    await experiment.getByRole('link', { name: /santi020k auth.*View project/u }).click()
    await expect(page).toHaveURL(/\/portfolio\/auth\/$/u)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('santi020k auth')
  })
})
