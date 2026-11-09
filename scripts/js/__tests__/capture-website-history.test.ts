import { resolve } from 'node:path'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import current from '../../../packages/website-history/current.json' with { type: 'json' }
import versions from '../../../packages/website-history/versions.json' with { type: 'json' }

interface Navigation {
  html: string
  /** `null` mirrors `page.goto` resolving without a main-resource response. */
  status: number | null
}

interface Capture {
  closedPages: string[]
  navigations: Map<string, Navigation>
  screenshots: string[]
  written: { file: string, input: string, quality: number }[]
}

const [firstArchive, secondArchive] = versions

if (!firstArchive || !secondArchive) throw new Error('Website history needs at least two archived versions')

const baseUrl = 'http://127.0.0.1:4999'
const output = resolve(import.meta.dirname, '../../../src/assets/website-history')
const devices = ['desktop', 'mobile']
const ids = [...versions.map(({ id }) => id), current.id]
const urlFor = (id: string) => `${baseUrl}${id === current.id ? '/' : `/${id}/`}`

const currentDocument = '<head><title>Santiago Molina</title></head><body><main><h1>Current website</h1></main></body>'

// Mirrors the head and body injections of scripts/js/assemble-website-history.mjs.
const archiveDocument = ({ date, id, title }: { date: string, id: string, title: string }) => `<head><title>${title}</title><style data-website-archive>.website-archive-banner{display:flex}</style><script type="module" src="/${id}/archive-banner.js" data-website-archive></script></head><body><a href="#main">Skip to content</a><aside class="website-archive-banner" aria-label="Website archive"><div class="website-archive-inner"><p><span class="website-archive-heading">Archived website</span><strong><span class="website-archive-version">${id.toUpperCase()}</span> · <time datetime="${date}">${date}</time></strong><small>Forms and comments are disabled.</small></p><nav aria-label="Leave this archive"><a href="/" data-astro-reload>Current homepage</a><a href="/history/" data-astro-reload>Website history</a></nav></div></aside><main id="main"><h1>${title}</h1></main></body>`

const createCapture = (overrides: [string, Navigation][] = []): Capture => ({
  closedPages: [],
  navigations: new Map<string, Navigation>([
    ...versions.map((version): [string, Navigation] => [
      urlFor(version.id), { html: archiveDocument(version), status: 200 }
    ]),
    [urlFor(current.id), { html: currentDocument, status: 200 }],
    ...overrides
  ]),
  screenshots: [],
  written: []
})

// Pages run one at a time, so the test document stands in for the active page.
const createPage = (capture: Capture) => {
  let url = ''

  return {
    addStyleTag: ({ content }: { content: string }) => {
      const style = document.createElement('style')

      style.textContent = content
      document.head.append(style)

      return Promise.resolve()
    },
    close: () => {
      capture.closedPages.push(url)

      return Promise.resolve()
    },
    evaluate: async (script: () => Promise<unknown>) => script(),
    goto: (target: string) => {
      const navigation = capture.navigations.get(target) ?? { html: currentDocument, status: 404 }

      url = target
      document.documentElement.innerHTML = navigation.html

      const { status } = navigation

      return Promise.resolve(status === null ? null : { ok: () => status >= 200 && status < 300, status: () => status })
    },
    locator: (selector: string) => ({
      count: () => Promise.resolve(document.querySelectorAll(selector).length),
      evaluateAll: (script: (elements: Element[]) => unknown) => Promise.resolve(script([
        ...document.querySelectorAll(selector)
      ])),
      textContent: () => {
        const elements = [...document.querySelectorAll(selector)]
        const [element] = elements

        if (!element || elements.length !== 1) throw new Error(`Locator resolved to ${elements.length} elements`)

        return Promise.resolve(element.textContent)
      }
    }),
    screenshot: () => {
      capture.screenshots.push(url)

      return Promise.resolve(Buffer.from(url))
    }
  }
}

const loadCapture = (capture: Capture) => {
  const browser = {
    close: vi.fn(() => Promise.resolve()),
    newPage: vi.fn(() => Promise.resolve(createPage(capture)))
  }
  const launch = vi.fn(() => Promise.resolve(browser))
  const mkdir = vi.fn(() => Promise.resolve())

  const sharp = vi.fn((input: Buffer) => ({
    webp: ({ quality }: { quality: number }) => ({
      toFile: (file: string) => {
        capture.written.push({ file, input: input.toString(), quality })

        return Promise.resolve({ size: input.length })
      }
    })
  }))

  vi.resetModules()
  vi.doMock('@playwright/test', () => ({ chromium: { launch } }))
  vi.doMock('sharp', () => ({ default: sharp }))
  // Only mkdir is provided, so any other filesystem access fails instead of touching the tree.
  vi.doMock('node:fs/promises', () => ({ mkdir }))

  return { browser, launch, mkdir, run: import('../capture-website-history.mjs') }
}

describe('website history capture', () => {
  beforeEach(() => {
    vi.stubEnv('HISTORY_PREVIEW_URL', baseUrl)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    // jsdom has no FontFaceSet; the capture waits on document.fonts.ready.
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    Reflect.deleteProperty(document, 'fonts')
    document.documentElement.innerHTML = '<head></head><body></body>'
  })

  test('captures every era on both devices from successful archive responses', async () => {
    const capture = createCapture()
    const { browser, launch, mkdir, run } = loadCapture(capture)

    await run

    const expected = ids.flatMap(id => devices.map(device => ({ file: resolve(output, `${id}-${device}.webp`), input: urlFor(id), quality: 86 })))

    expect(launch).toHaveBeenCalledOnce()
    expect(mkdir).toHaveBeenCalledWith(output, { recursive: true })
    expect(expected).toHaveLength((versions.length + 1) * devices.length)
    expect(capture.screenshots).toEqual(expected.map(({ input }) => input))
    expect(capture.written).toEqual(expected)
    expect(capture.closedPages).toEqual(expected.map(({ input }) => input))
    expect(browser.newPage).toHaveBeenCalledTimes(expected.length)
    expect(browser.close).toHaveBeenCalledOnce()
  })

  test.each([
    { name: 'an HTTP 404 archive response', id: firstArchive.id, navigation: { html: archiveDocument(firstArchive), status: 404 }, error: 'HTTP 404' },
    { name: 'an HTTP 404 current homepage', id: current.id, navigation: { html: currentDocument, status: 404 }, error: 'HTTP 404' },
    { name: 'a navigation without a response', id: firstArchive.id, navigation: { html: archiveDocument(firstArchive), status: null }, error: 'no response' },
    { name: 'a 200 page without the archive notice', id: firstArchive.id, navigation: { html: currentDocument, status: 200 }, error: `missing the "${firstArchive.id.toUpperCase()} · ${firstArchive.date}" archive notice` },
    { name: 'a 200 archive of another version', id: firstArchive.id, navigation: { html: archiveDocument(secondArchive), status: 200 }, error: `missing the "${firstArchive.id.toUpperCase()} · ${firstArchive.date}" archive notice` },
    { name: 'an archive mounted as the current homepage', id: current.id, navigation: { html: archiveDocument(firstArchive), status: 200 }, error: 'current homepage contains an archive notice' }
  ])('rejects $name before capturing it', async ({ id, navigation, error }) => {
    const url = urlFor(id)
    const capture = createCapture([[url, navigation]])
    const { browser, run } = loadCapture(capture)

    await expect(run).rejects.toThrow(error)

    expect(capture.screenshots).not.toContain(url)
    expect(capture.written.map(({ input }) => input)).not.toContain(url)
    expect(browser.close).toHaveBeenCalledOnce()
  })
})
