import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark'] as const) {
  test(`Resume preserves readable experience and skill groups in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/resume/')
    const entries = page.locator('[data-resume-entry], [data-resume-compact-entry], [data-resume-community-entry]')

    await expect(entries).toHaveCount(9)
    for (const entry of await entries.all()) {
      await expect(entry.getByRole('heading', { level: 3 })).not.toBeEmpty()
      await expect(entry.locator('[data-resume-date]')).not.toBeEmpty()
      await expect(entry.locator(':scope > p')).not.toBeEmpty()
      const evidenceLink = entry.locator('[data-resume-evidence-note]').getByRole('link')

      await expect(evidenceLink).toHaveCount(1)
      await expect(evidenceLink).toHaveAttribute('href', /^\/portfolio\/[^/]+\/$/u)
      await expect(evidenceLink).toHaveAccessibleName(/^Read the .+ case study$/u)
      await evidenceLink.focus()
      await expect(evidenceLink).toHaveCSS('outline-style', 'solid')
      const arrowInset = await evidenceLink.evaluate(link => {
        const arrow = link.querySelector('[data-resume-evidence-arrow]')

        if (!arrow) throw new Error('Evidence links must include their directional cue')
        return link.getBoundingClientRect().right - arrow.getBoundingClientRect().right
      })

      expect(arrowInset).toBeLessThanOrEqual(2)
    }
    for (const entry of await page.locator('[data-resume-entry], [data-resume-community-entry]').all()) {
      await expect(entry.locator('[data-resume-stack] > span').first()).toBeVisible()
      await expect(entry.getByRole('list')).toHaveCount(1)
      await expect(entry.getByRole('listitem').first()).toBeVisible()
    }
    const skills = page.locator('[data-resume-skills] > div')
    const readableRows = entries.or(skills)

    await expect(skills.getByRole('heading', { level: 3 })).toHaveText([
      'Languages', 'Front-End', 'Back-End', 'DevOps & Architecture'
    ])
    for (const skill of await skills.all()) await expect(skill.locator('p')).not.toBeEmpty()
    await expectNoUnexpectedAccessibilityViolations(page)
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const overflow = await readableRows.evaluateAll(rows => rows.flatMap(row => {
          const bounds = row.getBoundingClientRect()

          return [...row.querySelectorAll('h3, [data-resume-date], p, h4, li, [data-resume-stack] > span, a')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, bounds.left) - 1 ||
              rect.right > Math.min(innerWidth, bounds.right) + 1 ||
              rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        }))

        expect(overflow, `Resume copy at ${width}px and ${size}% must fit`).toEqual([])
        const overlap = await entries.evaluateAll(rows => rows.some(row => {
          const date = row.querySelector('[data-resume-date]')?.getBoundingClientRect()
          const heading = row.querySelector('h3')?.getBoundingClientRect()

          return date && heading && date.right > heading.left + 1 && date.bottom > heading.top + 1
        }))

        expect(overlap, 'Dates must not overlap their role headings').toBe(false)
        for (const link of await entries.locator('[data-resume-evidence-note] a').all()) {
          expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('Resume print keeps inline roles and a compact impact list', async ({ page }) => {
  await page.goto('/resume/')
  await page.emulateMedia({ media: 'print' })
  const skills = page.locator('[data-resume-skills]')

  await expect(skills.locator(':scope > div')).toHaveCount(4)
  expect(await skills.evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length)).toBe(2)
  for (const heading of await skills.getByRole('heading', { level: 3 }).all()) {
    await expect(heading).toBeVisible()
    await expect(heading).toHaveCSS('text-transform', 'uppercase')
  }
  const entries = page.locator('[data-resume-entry]')

  for (const entry of await entries.all()) {
    await expect(entry.locator('[data-resume-role-separator]')).toBeVisible()
    await expect(entry.locator('[data-resume-stack]')).toBeHidden()
    await expect(entry.getByRole('list')).toHaveCSS('list-style-type', 'disc')
    await expect(entry).toHaveCSS('break-inside', 'avoid')
  }
  await expect(entries.nth(2)).toHaveCSS('break-before', 'page')
  const community = page.locator('[data-resume-community-entry]')

  await expect(community).toHaveCount(1)
  await expect(community).toBeVisible()
  await expect(community.locator('[data-resume-community-header]')).toHaveCSS('display', 'flex')
  await expect(community.locator('[data-resume-role-separator]')).toBeVisible()
  await expect(community.locator('[data-resume-stack]')).toBeHidden()
  await expect(community.getByRole('list')).toHaveCSS('list-style-type', 'disc')
  await expect(community).toHaveCSS('break-inside', 'avoid')
  const compact = page.locator('[data-resume-compact-entry]')

  await expect(compact).toHaveCount(4)
  for (const entry of await compact.all()) await expect(entry).toBeHidden()
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-resume-variant', 'full')
  })
  await expect(community).toBeVisible()
  await expect(skills).toBeVisible()
  expect(await skills.evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length)).toBe(2)
  for (const entry of await compact.all()) {
    await expect(entry).toBeVisible()
    await expect(entry.locator('[data-resume-role-separator]')).toBeVisible()
    await expect(entry).toHaveCSS('break-inside', 'avoid')
  }
  await expect(page.locator('[data-resume-evidence-note]')).toHaveCount(9)
  for (const note of await page.locator('[data-resume-evidence-note]').all()) await expect(note).toBeHidden()
})

test('Resume evidence links open the matching case studies without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
  const page = await context.newPage()

  for (const project of [
    { title: 'Smith Commerce', slug: 'smith-commerce' },
    { title: 'X Games', slug: 'xgames' },
    { title: 'Void.GG', slug: 'void' },
    { title: 'Optic Power', slug: 'optic-power' },
    { title: 'PADS', slug: 'pads' },
    { title: 'Datagran', slug: 'datagran' },
    { title: 'Justbit.site', slug: 'justbit' },
    { title: 'Nebular Technologies', slug: 'nebular' },
    { title: 'ReactJS Colombia', slug: 'react-js-colombia' }
  ]) {
    await page.goto('/resume/')
    const link = page.getByRole('link', { name: `Read the ${project.title} case study`, exact: true })

    await link.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/portfolio/${project.slug}/`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(project.title)
  }
  await context.close()
})
