import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'

import { siteConfig } from '../site.config'

import rss from '@astrojs/rss'

export const GET = async (context: APIContext) => {
  const posts = (await getCollection('post', ({ data }) => (
    import.meta.env.PROD ? !data.draft : true
  )))
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())

  return rss({
    title: `${siteConfig.title} RSS Feed`,
    description: 'Writing on software architecture, automation, developer experience, and calmer delivery systems.',
    site: context.site ?? 'https://santi020k.me/',
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `/blog/${post.id}/`
    }))
  })
}
