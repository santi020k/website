import type { APIContext } from 'astro'

import { ogManifest } from '../data/og-manifest'
import { siteConfig } from '../site.config'
import { getCachedPosts } from '../utils/content'
import { getPostPath } from '../utils/links'
import { getSocialImageURL } from '../utils/social-image'

const jsonFeedKeys = {
  contentText: 'content_text',
  dateModified: 'date_modified',
  datePublished: 'date_published',
  externalUrl: 'external_url',
  feedUrl: 'feed_url',
  homePageUrl: 'home_page_url'
} as const

/**
 * JSON Feed 1.1 endpoint mirroring the RSS feed for reader apps that prefer
 * JSON (NetNewsWire, Feedbin, Inoreader, etc.). Spec: https://jsonfeed.org/version/1.1
 */
export const GET = async (context: APIContext) => {
  const posts = await getCachedPosts()
  const site = (context.site ?? new URL('https://santi020k.com/')).toString()

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${siteConfig.title} JSON Feed`,
    description:
      'Writing on software, reading, gaming, and everyday discoveries.',
    [jsonFeedKeys.homePageUrl]: site,
    [jsonFeedKeys.feedUrl]: new URL('/feed.json', site).toString(),
    icon: new URL('/icons/icon-512.webp', site).toString(),
    favicon: new URL('/favicon.webp', site).toString(),
    language: siteConfig.lang,
    authors: [
      {
        name: siteConfig.author,
        url: site
      }
    ],
    items: posts.map(post => {
      const postPath = getPostPath(post.id)
      const postUrl = new URL(postPath, site).toString()

      return {
        id: postUrl,
        url: postUrl,
        ...(post.data.canonicalUrl && post.data.canonicalUrl !== postUrl ?
          { [jsonFeedKeys.externalUrl]: post.data.canonicalUrl } :
          {}),
        title: post.data.title,
        summary: post.data.description,
        [jsonFeedKeys.contentText]: post.data.description,
        image: getSocialImageURL(postPath, site, undefined, ogManifest),
        [jsonFeedKeys.datePublished]: post.data.publishDate.toISOString(),
        ...(post.data.updatedDate ? { [jsonFeedKeys.dateModified]: post.data.updatedDate.toISOString() } : {}),
        tags: post.data.tags,
        authors: [{ name: siteConfig.author }]
      }
    })
  }

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8'
    }
  })
}
