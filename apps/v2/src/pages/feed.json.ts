import type { APIContext } from 'astro'

import { siteConfig } from '../site.config'
import { getCachedPosts } from '../utils/content'
import { getPostPath } from '../utils/links'

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
      'Writing on software architecture, automation, developer experience, and calmer delivery systems.',
    home_page_url: site,
    feed_url: new URL('/feed.json', site).toString(),
    language: siteConfig.lang,
    authors: [
      {
        name: siteConfig.author,
        url: site
      }
    ],
    items: posts.map(post => ({
      id: new URL(getPostPath(post.id), site).toString(),
      url: new URL(getPostPath(post.id), site).toString(),
      title: post.data.title,
      summary: post.data.description,
      content_text: post.data.description,
      date_published: post.data.publishDate.toISOString(),
      ...(post.data.updatedDate ? { date_modified: post.data.updatedDate.toISOString() } : {}),
      tags: post.data.tags,
      authors: [{ name: siteConfig.author }]
    }))
  }

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/feed+json; charset=utf-8'
    }
  })
}
