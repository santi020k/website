import rss from '@astrojs/rss'
import type { APIContext } from 'astro'

import type { Locale } from '@/i18n'
import { localeLanguage, localizePath } from '@/i18n'
import { collectionTranslator } from '@/i18n/collection-copy'

import { siteConfig } from '../site.config'
import { getCachedPosts } from '../utils/content'
import { localizePost } from '../utils/content-translations'
import { renderFeedContent } from '../utils/feed-content'
import { getPostPath } from '../utils/links'

/**
 * Makes a value safe to embed inside a CDATA section. Entity escaping must not
 * be used here: CDATA content is not entity-decoded, so `&amp;` would surface
 * literally in readers. Only the section terminator needs escaping.
 */
const escapeCdata = (value: string): string => value.replaceAll(']]>', ']]]]><![CDATA[>')

/**
 * Posts a feed in this language can list. English lists every published post; Spanish
 * lists only posts with a complete translation, so no entry links to an English fallback.
 */
export const getFeedPosts = async (locale: Locale) => {
  const posts = await Promise.all((await getCachedPosts()).map(post => localizePost(post, locale)))

  return locale === 'en' ? posts : posts.filter(post => post.data.contentLocale === locale)
}

export const createRssFeed = async (context: APIContext, locale: Locale) => {
  const t = collectionTranslator(locale)
  const posts = await getFeedPosts(locale)

  return rss({
    title: t('feed.rssTitle', { title: siteConfig.title }),
    description: t('feed.description'),
    site: context.site ?? 'https://santi020k.com/',
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/' },
    customData: `<language>${localeLanguage(locale)}</language>`,
    items: await Promise.all(posts.map(async post => {
      const link = localizePath(getPostPath(post.id), locale)
      // The whole article, so readers and the newsletter's RSS-to-email do not stop at the summary.
      const content = await renderFeedContent(post, locale, new URL(link, context.site ?? 'https://santi020k.com/'))

      return {
        title: post.data.title,
        description: post.data.description,
        ...(content ? { content } : {}),
        pubDate: post.data.publishDate,
        link,
        categories: post.data.tags,
        // RSS 2.0 <author> must be an email address; dc:creator carries the name.
        customData: `<dc:creator><![CDATA[${escapeCdata(siteConfig.author)}]]></dc:creator>`
      }
    }))
  })
}

export const GET = (context: APIContext) => createRssFeed(context, 'en')
