import type { APIContext } from 'astro'

import { siteConfig } from '../site.config'
import { getCachedPosts } from '../utils/content'
import { getPostPath } from '../utils/links'

import rss from '@astrojs/rss'

const escapeXml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

export const GET = async (context: APIContext) => {
  const posts = await getCachedPosts()

  return rss({
    title: `${siteConfig.title} RSS Feed`,
    description: 'Writing on software architecture, automation, developer experience, and calmer delivery systems.',
    site: context.site ?? 'https://santi020k.com/',
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/' },
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: getPostPath(post.id),
      categories: post.data.tags,
      author: siteConfig.author,
      customData: `<dc:creator><![CDATA[${escapeXml(siteConfig.author)}]]></dc:creator>`
    }))
  })
}
