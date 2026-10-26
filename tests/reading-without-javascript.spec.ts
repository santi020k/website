import { expect, type Locator, type Page, test } from '@playwright/test'

const ARTICLE_PATH = '/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/'
const CODE_COPY_LABEL = 'Copy code to clipboard'
// Articles without a canonicalUrl render the Lumen CopyButton in the hero.
const HERO_COPY_ARTICLE_PATH = '/blog/avoid-magic-strings-in-typescript-and-javascript/'
const HERO_COPY_LABEL = 'Copy link to article'
const HERO_COPY_STORAGE_KEY = 'hero-copy-value'

interface CommandGroup {
  readonly commands: readonly [string, string, string, string]
  readonly label: string
}

interface ShareLink {
  readonly href: RegExp
  readonly name: string
}

const commandGroups: readonly CommandGroup[] = [
  {
    commands: [
      'npm install --save-dev husky lint-staged',
      'yarn add --dev husky lint-staged',
      'pnpm add --save-dev husky lint-staged',
      'bun add --dev husky lint-staged'
    ],
    label: 'Choose a package manager to install the development dependencies'
  },
  {
    commands: ['npm run prepare', 'yarn run prepare', 'pnpm run prepare', 'bun run prepare'],
    label: 'Choose a package manager to prepare the Husky hooks'
  }
]

const shareLinks: readonly ShareLink[] = [
  { href: /^https:\/\/www\.linkedin\.com\/sharing\/share-offsite\/\?url=/u, name: 'Share on LinkedIn' },
  { href: /^https:\/\/twitter\.com\/intent\/tweet\?text=/u, name: 'Share on X' },
  { href: /^https:\/\/api\.whatsapp\.com\/send\?text=/u, name: 'Share on WhatsApp' }
]

const viewports = [
  { height: 844, name: 'mobile', width: 390 },
  { height: 900, name: 'desktop', width: 1440 }
] as const

// The tablist names each group; it stays in the DOM even when the fallback hides it.
const codeTabsGroup = (page: Page, label: string): Locator => page
  .locator('[data-package-manager-code-tabs]')
  .filter({ has: page.getByRole('tablist', { includeHidden: true, name: label }) })

const hasNoDocumentOverflow = (page: Page): Promise<boolean> => page.evaluate(() => (
  document.documentElement.scrollWidth <= document.documentElement.clientWidth
))

const openContents = async (page: Page) => {
  const opener = page.locator('[data-post-mobile-toc] [data-toc-opener]')

  if (await opener.isVisible()) {
    await expect(opener).not.toHaveAttribute('open')
    await opener.locator('[data-toc-summary]').focus()
    await page.keyboard.press('Enter')
    await expect(opener).toHaveAttribute('open', '')
  }
}

for (const viewport of viewports) {
  test.describe(`Article reading without JavaScript on ${viewport.name}`, () => {
    test.use({
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
      viewport: { height: viewport.height, width: viewport.width }
    })

    test('shows every package-manager command without inert tab or copy controls', async ({ page }) => {
      await page.goto(ARTICLE_PATH)

      for (const group of commandGroups) {
        const tabs = codeTabsGroup(page, group.label)

        await expect(tabs).toHaveCount(1)
        await expect(tabs.getByRole('tablist', { includeHidden: true })).toBeHidden()
        await expect(tabs.getByRole('tab')).toHaveCount(0)
        await expect(tabs.getByRole('tabpanel')).toHaveCount(group.commands.length)

        const commands = tabs.getByRole('region', { name: `${group.label} code`, exact: true })

        await expect(commands).toHaveText(group.commands)

        for (const command of await commands.all()) {
          await expect(command).toBeVisible()
        }
      }

      const prose = page.locator('.prose-santi')

      expect(await prose.getByRole('button', { includeHidden: true, name: CODE_COPY_LABEL }).count()).toBeGreaterThan(0)
      await expect(prose.getByRole('button', { name: CODE_COPY_LABEL })).toHaveCount(0)
      await expect(page.getByRole('button', { includeHidden: true, name: 'Copy link', exact: true })).toHaveCount(1)
      await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(0)
      expect(await hasNoDocumentOverflow(page)).toBe(true)
    })

    test('keeps native contents jumps and external share links', async ({ page }) => {
      await page.goto(ARTICLE_PATH)

      for (const link of shareLinks) {
        const share = page.getByRole('link', { name: link.name, exact: true })

        await expect(share).toBeVisible()
        await expect(share).toHaveAttribute('href', link.href)
        await expect(share).toHaveAttribute('target', '_blank')
        await expect(share).toHaveAttribute('rel', 'noopener noreferrer')
      }

      await openContents(page)

      await page
        .getByRole('navigation', { name: 'Table of contents' })
        .getByRole('link', { name: 'Conclusions', exact: true })
        .click()

      await expect(page).toHaveURL(/#conclusions$/u)
      await expect(page.getByRole('heading', { level: 2, name: 'Conclusions', exact: true })).toBeInViewport()
      expect(await hasNoDocumentOverflow(page)).toBe(true)
    })

    test('hides the inert article hero copy control', async ({ page }) => {
      await page.goto(HERO_COPY_ARTICLE_PATH)

      const hero = page.locator('.editorial-detail-hero')

      await expect(hero.getByRole('button', { includeHidden: true, name: HERO_COPY_LABEL, exact: true })).toHaveCount(1)
      await expect(hero.getByRole('button', { name: HERO_COPY_LABEL, exact: true })).toHaveCount(0)
      expect(await hasNoDocumentOverflow(page)).toBe(true)
    })
  })

  test.describe(`Article reading with JavaScript on ${viewport.name}`, () => {
    test.use({ viewport: { height: viewport.height, width: viewport.width } })

    test('keeps tab selection, a single panel, and copy controls', async ({ page }) => {
      await page.goto(ARTICLE_PATH)

      for (const group of commandGroups) {
        const tabs = codeTabsGroup(page, group.label)
        const tablist = tabs.getByRole('tablist', { name: group.label, exact: true })

        await expect(tablist).toBeVisible()
        await expect(tablist.getByRole('tab')).toHaveText(['npm', 'yarn', 'pnpm', 'Bun'])
        await expect(tablist.getByRole('tab', { name: 'npm', exact: true })).toHaveAttribute('aria-selected', 'true')
        await expect(tabs.getByRole('tabpanel')).toHaveCount(1)
        await expect(tabs.getByRole('region', { name: `${group.label} code`, exact: true })).toHaveText([group.commands[0]])
        await expect(tabs.getByRole('button', { name: CODE_COPY_LABEL, exact: true })).toBeVisible()
      }

      await expect(page.getByRole('button', { name: /^(?:Copy|Share) link$/u })).toBeVisible()
    })

    test('keeps the article hero copy control usable', async ({ page }) => {
      await page.addInitScript(storageKey => {
        const clipboard: Pick<Clipboard, 'writeText'> = {
          writeText: (value: string) => {
            sessionStorage.setItem(storageKey, value)

            return Promise.resolve()
          }
        }

        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
      }, HERO_COPY_STORAGE_KEY)
      await page.goto(`${HERO_COPY_ARTICLE_PATH}?source=reading-test#details`)

      // Located by its hook, since the accessible name switches to the copied feedback.
      const copy = page.locator('.editorial-detail-hero [data-ui-copy-button]')

      await expect(copy).toBeVisible()
      await expect(copy).toHaveAccessibleName(HERO_COPY_LABEL)
      await copy.click()

      await expect(copy).toHaveText('Copied!', { useInnerText: true })
      // The permalink drops the live query and fragment.
      await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), HERO_COPY_STORAGE_KEY))
        .toBe(`https://santi020k.com${HERO_COPY_ARTICLE_PATH}`)
    })
  })
}
