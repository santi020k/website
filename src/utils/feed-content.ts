import { loadRenderers } from 'astro:container'
import type { CollectionEntry } from 'astro:content'
import { render } from 'astro:content'

import { getContainerRenderer } from '@astrojs/mdx/container-renderer'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'

import type { Locale } from '@/i18n'

import { getPostTranslation } from './content-translations'
import { toFeedHtml } from './feed-html'

let container: Promise<AstroContainer> | undefined

const getContainer = () => {
  container ??= loadRenderers([getContainerRenderer()]).then(renderers => AstroContainer.create({ renderers }))

  return container
}

/** The RSS and JSON feeds of each language render the same articles; render each one once. */
const rendered = new Map<string, Promise<string>>()

/**
 * The full article body for feed readers and newsletter email, in the feed's language. Spanish
 * feeds only list translated posts, so the translation's body is used whenever it exists.
 */
export const renderFeedContent = (post: CollectionEntry<'post'>, locale: Locale, articleUrl: URL) => {
  const key = `${locale}:${post.id}`
  const cached = rendered.get(key)

  if (cached) return cached

  const html = (async () => {
    const entry = locale === 'es' ? await getPostTranslation(post.id) ?? post : post
    const { Content } = await render(entry)

    return toFeedHtml(await (await getContainer()).renderToString(Content), articleUrl)
  })()

  rendered.set(key, html)

  return html
}
