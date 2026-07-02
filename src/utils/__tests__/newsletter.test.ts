import { afterEach, describe, expect, test, vi } from 'vitest'

import { fetchNewsletterIssues, parseNewsletterFeed } from '../newsletter'

const sampleFeed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>Santiago Molina</title>
<item>
  <title>Calmer releases, issue #2</title>
  <link>https://buttondown.com/santi020k/archive/issue-2/</link>
  <description>
    &lt;p&gt;Notes on &lt;strong&gt;release automation&lt;/strong&gt; &amp;amp; review flow.&lt;/p&gt;
  </description>
  <pubDate>Tue, 03 Mar 2026 12:00:00 +0000</pubDate>
</item>
<item>
  <title><![CDATA[Hello world]]></title>
  <link>https://buttondown.com/santi020k/archive/issue-1/</link>
  <description><![CDATA[<p>First issue.</p>]]></description>
  <pubDate>Mon, 02 Feb 2026 12:00:00 +0000</pubDate>
</item>
</channel></rss>`

describe('parseNewsletterFeed', () => {
  test('parses items with decoded, stripped descriptions', () => {
    const issues = parseNewsletterFeed(sampleFeed)

    expect(issues).toHaveLength(2)
    expect(issues[0]?.title).toBe('Calmer releases, issue #2')
    expect(issues[0]?.link).toBe('https://buttondown.com/santi020k/archive/issue-2/')
    expect(issues[0]?.description).toBe('Notes on release automation & review flow.')
    expect(issues[0]?.pubDate?.toISOString()).toBe('2026-03-03T12:00:00.000Z')
  })

  test('handles CDATA blocks and sorts newest first', () => {
    const issues = parseNewsletterFeed(sampleFeed)

    expect(issues[1]?.title).toBe('Hello world')
    expect(issues[0]?.pubDate?.valueOf() ?? 0)
      .toBeGreaterThan(issues[1]?.pubDate?.valueOf() ?? Number.POSITIVE_INFINITY)
  })

  test('returns an empty list for feeds without items', () => {
    expect(parseNewsletterFeed('<rss><channel></channel></rss>')).toEqual([])
  })

  test('skips items missing a title or link', () => {
    const feed = '<rss><item><title>No link here</title></item></rss>'

    expect(parseNewsletterFeed(feed)).toEqual([])
  })
})

describe('fetchNewsletterIssues', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('fetches and parses the feed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(sampleFeed) }))

    const issues = await fetchNewsletterIssues('https://example.com/rss')

    expect(issues).toHaveLength(2)
  })

  test('returns an empty list on non-OK responses', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(fetchNewsletterIssues('https://example.com/rss')).resolves.toEqual([])
  })

  test('returns an empty list when fetch throws', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(fetchNewsletterIssues('https://example.com/rss')).resolves.toEqual([])
  })
})
