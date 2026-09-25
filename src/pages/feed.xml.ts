import rss from '@astrojs/rss'
import type { APIContext } from 'astro'

import { siteConfig } from '../site.config'
import { getCachedPosts } from '../utils/content'
import { getPostPath } from '../utils/links'

/**
 * Makes a value safe to embed inside a CDATA section. Entity escaping must not
 * be used here: CDATA content is not entity-decoded, so `&amp;` would surface
 * literally in readers. Only the section terminator needs escaping.
 */
const escapeCdata = (value: string): string => value.replaceAll(']]>', ']]]]><![CDATA[>')

export const GET = async (context: APIContext) => {
  const posts = await getCachedPosts()

  return rss({
    title: `${siteConfig.title} RSS Feed`,
    description: 'Writing on software, reading, gaming, and everyday discoveries.',
    site: context.site ?? 'https://santi020k.com/',
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/' },
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: getPostPath(post.id),
      categories: post.data.tags,
      author: siteConfig.author,
      customData: `<dc:creator><![CDATA[${escapeCdata(siteConfig.author)}]]></dc:creator>`
    }))
  })
}
