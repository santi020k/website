import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'

import { siteConfig } from '../site.config'

import rss from '@astrojs/rss'

export const GET = async (context: APIContext) => {
  const posts = await getCollection('post', ({ data }) => !data.draft)

  const sortedPosts = posts.sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime()
  )

  const { site } = context

  if (!site) {
    throw new Error('The "site" property is required in astro.config.ts to generate an RSS feed.')
  }

  return rss({
    title: `${siteConfig.title} — Blog`,
    description: siteConfig.description,
    site,
    items: sortedPosts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `/post/${post.id}/`
    })),
    customData: `<language>${siteConfig.lang}</language>`
  })
}
