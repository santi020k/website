import { expect, type Page, test } from '@playwright/test'

const policyMeta = 'meta[http-equiv="Content-Security-Policy"]'
const article = '/blog/storybook-in-action-with-next-js-tailwind-and-typescript/'

// Collect violations from the first script each document runs. A client-side swap keeps
// the document, so violations from swapped-in pages land in the same list.
const recordViolations = (page: Page) => page.addInitScript(() => {
  const violations: string[] = []

  Reflect.set(window, '__policyViolations', violations)
  document.addEventListener('securitypolicyviolation', event => {
    violations.push(`${event.effectiveDirective} ${event.blockedURI}`)
  })
})

const violations = (page: Page) => page.evaluate(() => [...Reflect.get(window, '__policyViolations') as string[]])

// Follow a same-origin link the way a reader would, so Astro's router handles it.
const followLink = async (page: Page, href: string) => {
  await page.evaluate(target => {
    const link = Object.assign(document.createElement('a'), { href: target, id: 'policy-test-link', textContent: 'Next page' })

    document.querySelector('main')?.append(link)
  }, href)
  await page.locator('#policy-test-link').click()
}

// Every executable inline script must be listed in the page policy.
const unlistedInlineScripts = (page: Page) => page.evaluate(async selector => {
  const policy = document.querySelector(selector)?.getAttribute('content') ?? ''
  const scripts = [...document.querySelectorAll('script:not([src])')]
    .filter(script => ['', 'module', 'text/javascript'].includes(script.getAttribute('type') ?? ''))
  const hashes = await Promise.all(scripts.map(async script => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script.textContent))

    return `'sha256-${btoa(String.fromCodePoint(...new Uint8Array(digest)))}'`
  }))

  return hashes.filter(hash => !policy.includes(hash))
}, policyMeta)

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await recordViolations(page)
})

for (const path of ['/', '/es/about/', article, '/portfolio/smith-commerce/', '/technologies/']) {
  test(`${path} allows its inline scripts by hash without unsafe-inline`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('load')

    const policy = page.locator(policyMeta)

    await expect(policy).toHaveCount(1)
    await expect(policy).toHaveAttribute('content', /^script-src 'self' 'wasm-unsafe-eval' .*'sha256-/u)
    await expect(policy).not.toHaveAttribute('content', /unsafe-inline/u)
    expect(await unlistedInlineScripts(page)).toEqual([])
    expect(await violations(page)).toEqual([])
  })
}

test('client-side navigation keeps the shared policy and runs the next page scripts', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => Reflect.set(window, '__sameDocument', true))
  await followLink(page, article)
  await expect(page).toHaveURL(article)
  await expect(page.locator('[data-article-prose]')).toBeVisible()

  expect(await page.evaluate(() => Reflect.get(window, '__sameDocument') === true)).toBe(true)
  await expect(page.locator(policyMeta)).toHaveCount(1)
  expect(await unlistedInlineScripts(page)).toEqual([])
  expect(await violations(page)).toEqual([])
})

test('an inline script outside the build policy does not run', async ({ page }) => {
  await page.goto('/about/')
  await page.evaluate(() => {
    const script = document.createElement('script')

    script.textContent = 'window.__injectedScriptRan = true'
    document.head.append(script)
  })

  await expect.poll(() => violations(page)).toContainEqual(expect.stringMatching(/^script-src-elem inline$/u))
  expect(await page.evaluate(() => Reflect.has(window, '__injectedScriptRan'))).toBe(false)
})

test('a page built with a different policy loads as a new document', async ({ page }) => {
  // Simulate a deployment between visits: the next page lists a hash this document lacks.
  await page.route('**/blog/', async route => {
    const response = await route.fetch()
    const html = (await response.text()).replace('script-src \'self\'', 'script-src \'self\' \'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=\'')

    await route.fulfill({ response, body: html })
  })
  await page.goto('/')
  await page.evaluate(() => Reflect.set(window, '__sameDocument', true))
  await followLink(page, '/blog/')
  await expect(page).toHaveURL('/blog/')
  await expect(page.locator(policyMeta)).toHaveAttribute('content', /sha256-A{43}=/u)

  expect(await page.evaluate(() => Reflect.has(window, '__sameDocument'))).toBe(false)
  expect(await violations(page)).toEqual([])
})
