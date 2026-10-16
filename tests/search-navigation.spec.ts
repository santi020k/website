import { expect, type Page, test } from '@playwright/test'

const searchEntries = [
  { title: 'Astro guide Alpha', path: '/about/' },
  { title: 'Astro guide Bravo', path: '/work/' },
  { title: 'Astro guide Charlie', path: '/projects/' },
  { title: 'Astro guide Delta', path: '/travel/' }
].map(entry => ({ ...entry, description: 'Practical Astro notes.', tags: ['Astro'], type: 'post' as const }))

const openSearch = async (page: Page) => {
  await page.locator('[data-site-search-trigger]').click()
  await page.locator('#site-search-input').fill('Astro')
  await expect(page.locator('[data-site-search-result]')).toHaveCount(4)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/search-index.json', route => route.fulfill({ json: searchEntries }))
})

test('editing a query selects its first result before Enter navigates', async ({ page }) => {
  await page.goto('/')
  await openSearch(page)

  const input = page.locator('#site-search-input')
  const results = page.locator('[data-site-search-result]')

  for (let index = 0; index < 3; index += 1) await input.press('ArrowDown')

  await expect(results.last()).toHaveAttribute('data-site-search-active', 'true')
  await input.fill('Astro guide')
  await expect(results).toHaveCount(4)
  await expect(results.first()).toHaveAttribute('data-site-search-active', 'true')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/about\/$/u)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/u)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
})

test('query updates and dismissal preserve router state, other parameters, and the fragment', async ({ page }) => {
  await page.goto('/?source=search-test#main')
  await page.locator('[data-site-search-trigger]').click()

  const before = await page.evaluate(() => {
    const state: unknown = window.history.state

    return state
  })

  expect(before).toEqual(expect.objectContaining({ index: expect.any(Number) }))

  for (const value of ['Astro', 'a', 'Astro guide']) {
    // Compare within the input event's task: the router may legitimately save
    // a newer scroll position between separate browser automation calls.
    const history = await page.locator('#site-search-input').evaluate((input, query) => {
      if (!(input instanceof HTMLInputElement)) throw new Error('Missing search input')

      const before: unknown = window.history.state

      input.value = query
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const after: unknown = window.history.state

      return { before, after }
    }, value)

    expect(history.after).toEqual(history.before)
    expect(new URL(page.url()).searchParams.get('q')).toBe(value.length >= 2 ? value : null)
    expect(new URL(page.url()).searchParams.get('source')).toBe('search-test')
    expect(new URL(page.url()).hash).toBe('#main')
  }

  const dismissed = await page.locator('#site-search-input').evaluate(input => {
    const before: unknown = window.history.state

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))

    const after: unknown = window.history.state

    return { before, after }
  })

  expect(dismissed.after).toEqual(dismissed.before)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  await expect(page).toHaveURL(/\/\?source=search-test#main$/u)
})

test('following a result clears the query before its close animation and keeps Back closed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?source=search-test')
  await openSearch(page)

  // Read the source URL in the same event turn as activation, before an Astro
  // page swap or the close animation can finish. Fast navigations must be safe.
  const queryAfterActivation = await page.locator('[data-site-search-result]').first().evaluate(link => {
    if (!(link instanceof HTMLAnchorElement)) throw new Error('Missing search result link')

    link.click()

    return new URL(window.location.href).searchParams.get('q')
  })

  expect(queryAfterActivation).toBeNull()
  await expect(page).toHaveURL(/\/about\/$/u)
  await expect(page.locator('html')).not.toHaveClass(/site-search-open/u)
  await expect(page.locator('body')).not.toHaveClass(/site-search-open/u)
  await page.goBack()
  await expect(page).toHaveURL(/\/\?source=search-test$/u)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  await expect(page.locator('[data-site-search-trigger]')).toHaveAttribute('aria-expanded', 'false')
})

test('a search deep link opens with its query and can be reopened after dismissal', async ({ page }) => {
  await page.goto('/?source=search-test&q=Astro#main')
  await expect(page.locator('#site-search-dialog')).toBeVisible()
  await expect(page.locator('#site-search-input')).toHaveValue('Astro')
  await expect(page.locator('[data-site-search-result]')).toHaveCount(4)
  expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
  await page.keyboard.press('Escape')
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  expect(new URL(page.url()).searchParams.has('q')).toBe(false)
  await page.locator('[data-site-search-trigger]').click()
  await expect(page.locator('#site-search-input')).toHaveValue('Astro')
  expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
  expect(new URL(page.url()).searchParams.get('source')).toBe('search-test')
  expect(new URL(page.url()).hash).toBe('#main')
})

test('a delayed native close leaves the destination query intact before a page swap', async ({ page }) => {
  await page.goto('/')
  await openSearch(page)

  const destination = await page.locator('#site-search-input').evaluate(async input => {
    const dialog = document.getElementById('site-search-dialog')

    if (!(dialog instanceof HTMLDialogElement)) throw new Error('Missing search dialog')

    const closed = new Promise<string>(resolve => {
      dialog.addEventListener('close', () => {
        resolve(window.location.href)
      }, { once: true })
    })

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))

    const state: unknown = window.history.state

    // A traversal changes location before Astro swaps the old document.
    window.history.replaceState(state, '', '/about/?q=Astro')

    return closed
  })

  expect(new URL(destination).pathname).toBe('/about/')
  expect(new URL(destination).searchParams.get('q')).toBe('Astro')
})

const newTabActivations = [
  { activation: 'click', activate: (page: Page) => page.locator('[data-site-search-result]').first().click({ modifiers: ['ControlOrMeta'] }) },
  { activation: 'keyboard', activate: (page: Page) => page.locator('#site-search-input').press('ControlOrMeta+Enter') }
]

for (const { activation, activate } of newTabActivations) {
  test(`opening a result in another tab with ${activation} preserves search`, async ({ page, context }) => {
    await page.goto('/')
    await openSearch(page)

    const opened = context.waitForEvent('page')

    await activate(page)

    const destination = await opened

    try {
      await expect(destination).toHaveURL(/\/about\/$/u)
      await expect(page.locator('#site-search-dialog')).toBeVisible()
      await expect(page.locator('#site-search-input')).toHaveValue('Astro')
      expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
    } finally {
      await destination.close()
    }
  })
}

test('Back leaves an open search and Forward restores its deep-linked query', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL(/\/about\/$/u)
  await openSearch(page)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/u)
  await expect(page.locator('#site-search-dialog')).toBeHidden()
  await expect(page.locator('html')).not.toHaveClass(/site-search-open/u)
  await expect(page.locator('body')).not.toHaveClass(/site-search-open/u)
  await openSearch(page)
  await page.locator('#site-search-input').fill('Astro guide')
  await page.locator('#site-search-input').press('ArrowDown')
  await page.locator('#site-search-input').press('ArrowDown')
  await expect(page.locator('[data-site-search-result]').nth(2)).toHaveAttribute('data-site-search-active', 'true')
  await page.keyboard.press('Escape')
  await page.goForward()
  await expect(page).toHaveURL(/\/about\/\?q=Astro$/u)
  await expect(page.locator('#site-search-dialog')).toBeVisible()
  await expect(page.locator('#site-search-input')).toHaveValue('Astro')
  await expect(page.locator('[data-site-search-result]')).toHaveCount(4)
  await expect(page.locator('[data-site-search-result]').first()).toHaveAttribute('data-site-search-active', 'true')
})

for (const composition of [
  { name: 'active composition', isComposing: true, keyCode: 13 },
  { name: 'the legacy IME signal', isComposing: false, keyCode: 229 }
]) {
  test(`Enter confirms ${composition.name} without opening a result`, async ({ page }) => {
    await page.goto('/')
    await openSearch(page)
    await page.locator('#site-search-input').evaluate((input, init) => {
      for (const key of ['ArrowDown', 'Escape', 'Enter']) {
        input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
      }
    }, { isComposing: composition.isComposing, keyCode: composition.keyCode })
    await expect(page.locator('#site-search-dialog')).toBeVisible()
    await expect(page.locator('[data-site-search-result]').first()).toHaveAttribute('data-site-search-active', 'true')
    expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
    await page.locator('#site-search-input').press('Enter')
    await expect(page).toHaveURL(/\/about\/$/u)
  })
}

test('a canceled result activation leaves the search open', async ({ page }) => {
  await page.goto('/')
  await openSearch(page)
  await page.locator('[data-site-search-result]').first().evaluate(link => {
    link.addEventListener('click', event => {
      event.preventDefault()
    }, { once: true })
  })
  await page.locator('[data-site-search-result]').first().click()
  await expect(page.locator('#site-search-dialog')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
})
