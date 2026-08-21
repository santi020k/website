import { XMLParser } from 'fast-xml-parser'

import { siteConfig } from '../site.config'
import type { MediumPost } from '../types/medium'

import { mediumPostsCache } from './medium-cache'

const MEDIUM_SITE_URL = siteConfig.contact.medium.replace(/\/$/, '')
const MEDIUM_FEED_URL = `${MEDIUM_SITE_URL}/feed`

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true
})

interface RawMediumItem {
  title?: string
  link?: string
  'content:encoded'?: string
  'dc:creator'?: string
  pubDate?: string
  guid?: string | { '#text'?: string, text?: string }
  category?: string | string[]
  'atom:updated'?: string
}

let mediumPostsPromise: Promise<MediumPost[]> | undefined

const decodeHtmlEntities = (value: string) => value
  .replaceAll('&nbsp;', ' ')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', '\'')
  .replaceAll('&amp;', '&')

const stripMarkup = (value: string) => value
  .replaceAll(/<figcaption[\s\S]*?<\/figcaption>/gi, ' ')
  .replaceAll(/<pre[\s\S]*?<\/pre>/gi, ' ')
  .replaceAll(/<code[\s\S]*?<\/code>/gi, ' ')
  .replaceAll(/<[^>]+>/g, ' ')

const normaliseWhitespace = (value: string) => value
  .replaceAll(/\s+/g, ' ')
  .trim()

const stripHtml = (value: string) => normaliseWhitespace(decodeHtmlEntities(stripMarkup(value)))
const normaliseParsedText = (value: string) => normaliseWhitespace(stripMarkup(value))

const extractImageUrl = (html: string) => {
  const doubleQuoteMatch = (/<img[^>]+src="([^"]+)"/i.exec(html))?.[1]
  const singleQuoteMatch = (/<img[^>]+src='([^']+)'/i.exec(html))?.[1]

  return doubleQuoteMatch ?? singleQuoteMatch ?? null
}

const getParagraphCandidates = (html: string) => [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
  .map(([, paragraph = '']) => stripHtml(paragraph))
  .filter(Boolean)

const clampExcerpt = (value: string, maxLength = 220) => {
  if (value.length <= maxLength) {
    return value
  }

  const shortened = value.slice(0, maxLength).trim()

  const sentenceBreaks = ['. ', '! ', '? ']
    .map(separator => shortened.lastIndexOf(separator))
    .filter(index => index >= 0)

  const lastSentenceBreak = Math.max(...sentenceBreaks, -1)

  if (lastSentenceBreak >= maxLength * 0.55) {
    return shortened.slice(0, lastSentenceBreak + 1).trim()
  }

  return `${shortened.replace(/[,:;-\s]+$/g, '').trim()}…`
}

const extractExcerpt = (html: string) => {
  const paragraphs = getParagraphCandidates(html)

  const ignoredPrefixes = [
    'Previous post:',
    'Read the Previous Post:',
    'Next Post:',
    'This article is part of'
  ]

  const candidate = paragraphs.find(paragraph => (
    paragraph.length > 70 && !ignoredPrefixes.some(prefix => paragraph.startsWith(prefix))
  )) ?? paragraphs.find(paragraph => paragraph.length > 40) ?? ''

  return clampExcerpt(candidate)
}

const getSlugFromLink = (link: string, fallback: string, index: number) => {
  try {
    const url = new URL(link)
    const segment = url.pathname.split('/').filter(Boolean).at(-1)

    if (segment) {
      return segment
    }
  } catch {
    // Fall through to the slugified title fallback.
  }

  const slug = fallback.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '')

  return slug || `post-${index}`
}

const formatPublicationName = (hostname: string) => hostname
  .replace(/^www\./, '')
  .replace(/\.com$/i, '')
  .split(/[.-]/)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

const normalisePost = (item: RawMediumItem, index: number): MediumPost => {
  const title = normaliseParsedText(item.title ?? '')
  const link = (item.link ?? '').trim()
  const content = item['content:encoded'] ?? ''

  const hostname = (() => {
    try {
      return new URL(link).hostname
    } catch {
      return 'medium.com'
    }
  })()

  const guidValue = (() => {
    if (typeof item.guid === 'string') return item.guid

    return item.guid?.['#text'] ?? item.guid?.text ?? ''
  })()

  const tagsValue = (() => {
    if (Array.isArray(item.category)) {
      return item.category.map(category => normaliseParsedText(category))
    }

    if (item.category) {
      return [normaliseParsedText(item.category)]
    }

    return []
  })()

  return {
    author: normaliseParsedText(item['dc:creator'] ?? siteConfig.author),
    excerpt: extractExcerpt(content),
    guid: guidValue,
    imageUrl: extractImageUrl(content),
    link,
    publication: formatPublicationName(hostname),
    publishedAt: item.pubDate ?? '',
    slug: getSlugFromLink(link, title, index),
    tags: tagsValue,
    title,
    updatedAt: item['atom:updated'] ?? item.pubDate ?? ''
  }
}

const parseFeed = (xml: string): MediumPost[] => {
  const parsed = parser.parse(xml) as {
    rss?: {
      channel?: {
        item?: RawMediumItem | RawMediumItem[]
      }
    }
  }

  const rawItems = parsed.rss?.channel?.item

  const items: RawMediumItem[] = (() => {
    if (Array.isArray(rawItems)) return rawItems

    if (rawItems) return [rawItems]

    return []
  })()

  const results: MediumPost[] = items.map((item, index) => normalisePost(item, index))

  return results.filter(post => post.title && post.link)
}

const loadMediumPosts = async (): Promise<MediumPost[]> => {
  try {
    const response = await fetch(MEDIUM_FEED_URL, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml'
      }
    })

    if (!response.ok) {
      throw new Error(`Medium RSS request failed with status ${response.status}`)
    }

    const xml = await response.text()
    const posts = parseFeed(xml)

    if (!posts.length) {
      throw new Error('Medium RSS feed returned no items')
    }

    return posts
  } catch {
    return mediumPostsCache
  }
}

export const getMediumPosts = async (): Promise<MediumPost[]> => {
  mediumPostsPromise ??= loadMediumPosts()

  return (await mediumPostsPromise)
}

export const getMediumPostBySlug = async (slug: string): Promise<MediumPost | undefined> => {
  const posts = await getMediumPosts()

  return posts.find(post => post.slug === slug)
}
