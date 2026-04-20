import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const makeRss = (items: string) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Test Feed</title>
    ${items}
  </channel>
</rss>`

const SINGLE_ITEM = makeRss(`
  <item>
    <title>A Practical Guide To Shipping Better React Components</title>
    <link>https://medium.com/@santi020k/a-practical-guide-abc123</link>
    <content:encoded><![CDATA[
      <p>This is the first paragraph which is long enough to become the excerpt for this article.</p>
      <p>Second paragraph with more detail about the topic at hand in the article body.</p>
    ]]></content:encoded>
    <dc:creator>Santiago Molina</dc:creator>
    <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
    <guid>https://medium.com/p/abc123</guid>
    <category>react</category>
    <category>typescript</category>
    <atom:updated>2024-01-02T10:00:00Z</atom:updated>
  </item>
`)

const ITEM_WITH_SINGLE_CATEGORY = makeRss(`
  <item>
    <title>Another Post With A Single Tag Here</title>
    <link>https://medium.com/@santi020k/another-post-xyz456</link>
    <content:encoded><![CDATA[<p>Content with enough text to be a proper excerpt for testing.</p>]]></content:encoded>
    <dc:creator>Santiago Molina</dc:creator>
    <pubDate>Tue, 02 Jan 2024 12:00:00 GMT</pubDate>
    <guid>https://medium.com/p/xyz456</guid>
    <category>javascript</category>
  </item>
`)

const ITEM_WITH_NO_LINK_TITLE = makeRss(`
  <item>
    <title></title>
    <link></link>
    <content:encoded><![CDATA[<p>Short.</p>]]></content:encoded>
    <dc:creator>Author</dc:creator>
    <pubDate>Wed, 03 Jan 2024 00:00:00 GMT</pubDate>
    <guid>https://medium.com/p/empty</guid>
  </item>
`)

const ITEM_WITH_INVALID_LINK = makeRss(`
  <item>
    <title>Post With Bad Link That Needs Slug Fallback</title>
    <link>not-a-valid-url</link>
    <content:encoded><![CDATA[<p>Paragraph long enough to serve as an excerpt for this test.</p>]]></content:encoded>
    <dc:creator>Author</dc:creator>
    <pubDate>Thu, 04 Jan 2024 00:00:00 GMT</pubDate>
    <guid>https://medium.com/p/badlink</guid>
  </item>
`)

const LONG_EXCERPT_CONTENT = makeRss(`
  <item>
    <title>Post With A Very Long Excerpt That Needs Truncating By The Clamp Function</title>
    <link>https://medium.com/@santi020k/long-excerpt-post</link>
    <content:encoded><![CDATA[
      <p>${'This is a very long sentence that keeps going and going and going. '.repeat(5)}</p>
    ]]></content:encoded>
    <dc:creator>Santiago Molina</dc:creator>
    <pubDate>Fri, 05 Jan 2024 00:00:00 GMT</pubDate>
    <guid>https://medium.com/p/longexcerpt</guid>
  </item>
`)

describe('getMediumPosts — successful fetch', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses a valid RSS feed and returns posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SINGLE_ITEM)
    }))

    const { getMediumPosts } = await import('../medium')
    const posts = await getMediumPosts()

    expect(posts).toHaveLength(1)
    expect(posts).toMatchObject([{
      title: 'A Practical Guide To Shipping Better React Components',
      slug: 'a-practical-guide-abc123',
      publication: 'Medium',
      tags: ['react', 'typescript']
    }])
  })

  it('returns cached result on second call without re-fetching', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SINGLE_ITEM)
    })
    vi.stubGlobal('fetch', mockFetch)

    const { getMediumPosts } = await import('../medium')
    await getMediumPosts()
    await getMediumPosts()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('handles a single category (not an array)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ITEM_WITH_SINGLE_CATEGORY)
    }))

    const { getMediumPosts } = await import('../medium')
    const posts = await getMediumPosts()

    expect(posts).toMatchObject([{ tags: ['javascript'], publication: 'Medium' }])
  })

  it('falls back to slug from title when link is not a valid URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ITEM_WITH_INVALID_LINK)
    }))

    const { getMediumPosts } = await import('../medium')
    const posts = await getMediumPosts()

    expect(posts).toMatchObject([{ slug: 'post-with-bad-link-that-needs-slug-fallback' }])
  })

  it('falls back to cache when all feed items lack a title or link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(ITEM_WITH_NO_LINK_TITLE)
    }))

    const { getMediumPosts } = await import('../medium')
    const { mediumPostsCache } = await import('../medium-cache')
    const posts = await getMediumPosts()

    // items without title/link are filtered → empty results → fallback to cache
    expect(posts).toEqual(mediumPostsCache)
  })

  it('truncates very long excerpts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(LONG_EXCERPT_CONTENT)
    }))

    const { getMediumPosts } = await import('../medium')
    const posts = await getMediumPosts()

    const [firstPost] = posts
    expect(firstPost?.excerpt.length).toBeLessThanOrEqual(220)
  })
})

describe('getMediumPosts — fetch failure', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to mediumPostsCache when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { getMediumPosts } = await import('../medium')
    const { mediumPostsCache } = await import('../medium-cache')
    const posts = await getMediumPosts()

    expect(posts).toEqual(mediumPostsCache)
  })

  it('falls back to cache when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('')
    }))

    const { getMediumPosts } = await import('../medium')
    const { mediumPostsCache } = await import('../medium-cache')
    const posts = await getMediumPosts()

    expect(posts).toEqual(mediumPostsCache)
  })

  it('falls back to cache when feed returns no items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(makeRss(''))
    }))

    const { getMediumPosts } = await import('../medium')
    const { mediumPostsCache } = await import('../medium-cache')
    const posts = await getMediumPosts()

    expect(posts).toEqual(mediumPostsCache)
  })
})

describe('getMediumPostBySlug', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the matching post by slug', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SINGLE_ITEM)
    }))

    const { getMediumPostBySlug } = await import('../medium')
    const post = await getMediumPostBySlug('a-practical-guide-abc123')

    expect(post).toBeDefined()
    expect(post?.title).toBe('A Practical Guide To Shipping Better React Components')
  })

  it('returns undefined for a slug that does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SINGLE_ITEM)
    }))

    const { getMediumPostBySlug } = await import('../medium')
    const post = await getMediumPostBySlug('non-existent-slug')

    expect(post).toBeUndefined()
  })
})
