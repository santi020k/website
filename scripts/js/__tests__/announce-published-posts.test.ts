// @vitest-environment node
import { describe, expect, test } from 'vitest'

import {
  createIndexNowPayload,
  discoverEndpoint,
  extractArticleBody,
  findOutboundLinks,
  isOwnHost
} from '../announce-published-posts.mjs'

const page = `
<header><a href="https://github.com/santi020k">Profile</a></header>
<div class="prose-santi" data-article-prose id="article-content" tabindex="-1">
  <p>Read <a href="https://astro.build/blog/astro-7/#intro">Astro 7</a> and
  <a href="https://astro.build/blog/astro-7/">again</a>.</p>
  <div class="callout"><a href="https://example.com/a?x=1&amp;y=2">nested</a></div>
  <p><a href="/blog/other-post/">internal</a> <a href="https://theme.santi020k.com/">own</a>
  <a href="mailto:hi@example.com">mail</a></p>
</div>
<footer><a href="https://nownownow.com/">footer link</a></footer>`

describe('announcing published posts', () => {
  test('reads only the article prose, including nested blocks', () => {
    const body = extractArticleBody(page)

    expect(body).toContain('nested')
    expect(body).not.toContain('footer link')
    expect(body).not.toContain('Profile')
    expect(extractArticleBody('<main>No article</main>')).toBe('')
  })

  test('keeps outbound http links once, without fragments or the site family', () => {
    expect(findOutboundLinks(extractArticleBody(page), 'https://santi020k.com/blog/post/')).toEqual([
      'https://astro.build/blog/astro-7/',
      'https://example.com/a?x=1&y=2'
    ])
    expect(isOwnHost('santi020k.com')).toBe(true)
    expect(isOwnHost('beacon.santi020k.com')).toBe(true)
    expect(isOwnHost('santi020k.com.example')).toBe(false)
  })

  test('discovers the Webmention endpoint from the Link header before the document', () => {
    const target = 'https://example.com/post/'

    expect(discoverEndpoint(target, '<https://example.com/style.css>; rel="preload", </webmention>; rel="webmention"', ''))
      .toBe('https://example.com/webmention')
    expect(discoverEndpoint(target, null, '<link rel="pingback" href="/xmlrpc"><link href="https://webmention.io/example.com/webmention" rel="webmention">'))
      .toBe('https://webmention.io/example.com/webmention')
    expect(discoverEndpoint(target, null, '<a rel="me webmention" href="mention?a=1&amp;b=2">endpoint</a>'))
      .toBe('https://example.com/post/mention?a=1&b=2')
    expect(discoverEndpoint(target, '<https://example.com/>; rel="canonical"', '<p>none</p>')).toBeUndefined()
  })

  test('builds an IndexNow submission that points at the hosted key file', () => {
    expect(createIndexNowPayload('abc123', ['https://santi020k.com/blog/post/'])).toEqual({
      host: 'santi020k.com',
      key: 'abc123',
      keyLocation: 'https://santi020k.com/indexnow-key.txt',
      urlList: ['https://santi020k.com/blog/post/']
    })
  })
})
