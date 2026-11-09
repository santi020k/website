import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { collectSitemapEntries, deduplicateSitemapSources, fetchSitemapText, renderSitemap } from '../sitemap.mjs'

const origin = 'https://santi020k.com'
const source = { origin, sitemap: '/sitemap-index.xml' }

describe('sitemap fetch recovery', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const url = `${origin}/sitemap.xml`

  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('returns a successful body without waiting or retrying', async () => {
    fetchMock.mockResolvedValue(new Response('<urlset/>'))

    await expect(fetchSitemapText(url)).resolves.toBe('<urlset/>')
    expect(fetchMock).toHaveBeenCalledOnce()
    const [requestedUrl, options] = fetchMock.mock.calls[0] ?? []

    expect(requestedUrl).toBe(url)
    expect(options?.headers).toEqual({ 'User-Agent': 'santi020k-cross-site-sitemap-builder/1.0' })
    expect(options?.signal).toBeInstanceOf(AbortSignal)
  })

  test.each([408, 429, 500, 503])('waits before retrying a transient HTTP %s response', async status => {
    const failedResponse = new Response('Temporarily unavailable', { status })
    fetchMock.mockResolvedValueOnce(failedResponse).mockResolvedValueOnce(new Response('<urlset/>'))
    const result = fetchSitemapText(url)

    await vi.advanceTimersByTimeAsync(999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(failedResponse.bodyUsed).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    await expect(result).resolves.toBe('<urlset/>')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('waits one and then two seconds when network failures persist', async () => {
    const failure = new TypeError('Connection reset')
    fetchMock.mockRejectedValue(failure)
    const result = fetchSitemapText(url)
    const outcome = result.catch((error: unknown) => error)

    await vi.advanceTimersByTimeAsync(999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1999)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(await outcome).toMatchObject({
      message: `Could not fetch ${url}: TypeError: Connection reset`,
      cause: failure
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  test.each([400, 401, 403, 404])('fails immediately for HTTP %s instead of repeating a permanent error', async status => {
    fetchMock.mockResolvedValue(new Response('Unavailable', { status }))

    await expect(fetchSitemapText(url)).rejects.toThrow(`HTTP ${status}`)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('retries a response whose body stream fails', async () => {
    const interrupted = new Response()
    vi.spyOn(interrupted, 'text').mockRejectedValue(new Error('Interrupted body'))
    fetchMock.mockResolvedValueOnce(interrupted).mockResolvedValueOnce(new Response('<urlset/>'))
    const result = fetchSitemapText(url)

    await vi.advanceTimersByTimeAsync(1000)
    await expect(result).resolves.toBe('<urlset/>')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('retains HTTP failure context when canceling its response body fails', async () => {
    const response = new Response('Unavailable', { status: 404 })
    const cleanupFailure = new Error('Body already closed')

    if (!response.body) throw new Error('Fixture requires a response body')

    vi.spyOn(response.body, 'cancel').mockRejectedValue(cleanupFailure)
    fetchMock.mockResolvedValue(response)
    const outcome = await fetchSitemapText(url).catch((error: unknown) => error)

    expect(outcome).toMatchObject({
      message: `Could not fetch ${url}: Error: HTTP 404`,
      cause: { message: 'HTTP 404', cause: cleanupFailure }
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('cross-site sitemap', () => {
  test('fetches a shared theme hub once while retaining distinct origins and paths', () => {
    const sources = [
      { origin: 'https://theme.santi020k.com', sitemap: '/sitemap.xml' },
      { origin: 'https://theme.santi020k.com/', sitemap: 'https://theme.santi020k.com/sitemap.xml' },
      { origin: 'https://theme.santi020k.com', sitemap: '/other.xml' },
      { origin: 'https://lumen.santi020k.com', sitemap: '/sitemap.xml' }
    ]

    expect(deduplicateSitemapSources(sources)).toEqual([sources[0], sources[2], sources[3]])
  })

  test('a duplicate optional source cannot weaken required-source validation', () => {
    const optional = { ...source, required: false }
    const required = { ...source, required: true }

    expect(deduplicateSitemapSources([optional, required])).toEqual([required])
    expect(deduplicateSitemapSources([required, optional])).toEqual([required])
  })

  test('flattens nested indexes, keeps lastmod, and deduplicates cyclic sources', async () => {
    const documents = new Map([
      [`${origin}/sitemap-index.xml`, `<sitemapindex><sitemap><loc>${origin}/pages.xml</loc></sitemap><sitemap><loc>${origin}/sitemap-index.xml</loc></sitemap></sitemapindex>`],
      [`${origin}/pages.xml`, `<urlset><url><loc>${origin}/blog/example/</loc><lastmod>2026-10-06T12:00:00.000Z</lastmod></url><url><loc>${origin}/</loc></url><url><loc>${origin}/blog/example/</loc></url></urlset>`]
    ])
    const entries = await collectSitemapEntries(source, url => {
      const document = documents.get(url)

      if (!document) throw new Error(`Unexpected sitemap: ${url}`)

      return Promise.resolve(document)
    })

    expect(entries).toEqual([
      { url: `${origin}/blog/example/`, lastmod: '2026-10-06T12:00:00.000Z' },
      { url: `${origin}/` }
    ])
    expect(renderSitemap(entries)).toContain('<lastmod>2026-10-06T12:00:00.000Z</lastmod>')
  })

  test.each([
    '<urlset><url><loc>https://example.com/</loc></url></urlset>',
    '<sitemapindex><sitemap><loc>https://example.com/sitemap.xml</loc></sitemap></sitemapindex>',
    `<urlset><url><loc>${origin}/</loc><lastmod>not-a-date</lastmod></url></urlset>`,
    '<html><body>Missing sitemap</body></html>',
    `<urlset><url><loc>${origin}/</loc></urlset>`,
    '<urlset><url><lastmod>2026-10-06</lastmod></url></urlset>'
  ])('rejects untrusted origins and invalid source metadata', async document => {
    await expect(collectSitemapEntries(source, () => Promise.resolve(document))).rejects.toThrow()
  })

  test.each(['2026-02-31', '2026-02-29', '1900-02-29', '2026-00-01', '2026-01-00', '2026-10-06T24:00:00Z', '2026-10-06T12:60:00Z', '2026-10-06T12:00:60Z', '2026-10-06T12:00:00+14:30'])('rejects impossible lastmod dates and timestamp ranges: %s', async lastmod => {
    await expect(collectSitemapEntries(source, () => Promise.resolve(
      `<urlset><url><loc>${origin}/</loc><lastmod>${lastmod}</lastmod></url></urlset>`
    ))).rejects.toThrow('valid date or timestamp')
  })

  test.each(['2000-02-29', '2024-02-29', '2026-10-06T12:00:00+14:00'])('preserves valid leap dates and timezone offsets: %s', async lastmod => {
    const entries = await collectSitemapEntries(source, () => Promise.resolve(
      `<urlset><url><loc>${origin}/</loc><lastmod>${lastmod}</lastmod></url></urlset>`
    ))

    expect(entries).toEqual([{ url: `${origin}/`, lastmod }])
  })

  test('preserves date-only lastmod values and escapes XML locations', async () => {
    const entries = await collectSitemapEntries(source, () => Promise.resolve(
      `<urlset><url><loc>${origin}/search/?a=1&amp;b=2</loc><lastmod>2026-10-06</lastmod></url></urlset>`
    ))

    expect(entries[0]?.lastmod).toBe('2026-10-06')
    expect(renderSitemap(entries)).toContain('<loc>https://santi020k.com/search/?a=1&amp;b=2</loc>')
  })

  test('keeps localized links and dates across duplicate URL entries', async () => {
    const entries = await collectSitemapEntries(source, () => Promise.resolve(`
      <urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">
        <url><loc>${origin}/</loc>
          <xhtml:link rel="alternate" hreflang="en" href="${origin}/"/>
          <xhtml:link rel="alternate" hreflang="es" href="${origin}/es/"/>
        </url>
        <url><loc>${origin}/</loc><lastmod>2026-10-06</lastmod>
          <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/?a=1&amp;b=2"/>
          <xhtml:link rel="alternate" hreflang="es" href="${origin}/es/"/>
        </url>
        <url><loc>${origin}/</loc></url>
      </urlset>
    `))

    expect(entries).toEqual([{
      url: `${origin}/`,
      lastmod: '2026-10-06',
      alternates: [
        { hreflang: 'en', href: `${origin}/` },
        { hreflang: 'es', href: `${origin}/es/` },
        { hreflang: 'x-default', href: `${origin}/?a=1&b=2` }
      ]
    }])

    const xml = renderSitemap(entries)

    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="x-default" href="${origin}/?a=1&amp;b=2"/>`)
    await expect(collectSitemapEntries(source, () => Promise.resolve(xml))).resolves.toEqual(entries)
  })

  test.each([
    [`<xhtml:link rel="alternate" hreflang="invalid locale" href="${origin}/es/"/>`, 'valid hreflang'],
    ['<xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/"/>', 'expected HTTPS origin']
  ])('rejects invalid alternate metadata: %s', async (link, error) => {
    const xml = `<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"><url><loc>${origin}/</loc>${link}</url></urlset>`

    await expect(collectSitemapEntries(source, () => Promise.resolve(xml))).rejects.toThrow(error)
  })
})
