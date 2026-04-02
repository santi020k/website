import { XMLParser } from 'fast-xml-parser'

import { mediumPostsCache } from '@/data/medium-cache'
import { siteConfig } from '@/site.config'
import type { MediumPost } from '@/types'

const MEDIUM_FEED_URL = `${siteConfig.contact.medium.replace(/\/$/, '')}/feed`

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true
})

let mediumPostsPromise: Promise<MediumPost[]> | undefined

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', '\'')
}

function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replaceAll(/<figcaption[\s\S]*?<\/figcaption>/gi, ' ')
      .replaceAll(/<pre[\s\S]*?<\/pre>/gi, ' ')
      .replaceAll(/<code[\s\S]*?<\/code>/gi, ' ')
      .replaceAll(/<[^>]+>/g, ' ')
  )
    .replaceAll(/\s+/g, ' ')
    .trim()
}

function extractImageUrl(html: string) {
  return (/<img[^>]+src="([^"]+)"/i.exec(html))?.[1] ?? (/<img[^>]+src='([^']+)'/i.exec(html))?.[1] ?? null
}

function getParagraphCandidates(html: string) {
  return [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
    .map(([, paragraph = '']) => stripHtml(paragraph))
    .filter(Boolean)
}

function extractExcerpt(html: string) {
  const paragraphs = getParagraphCandidates(html)

  const ignoredPrefixes = [
    'Previous post:',
    'Read the Previous Post:',
    'Next Post:',
    'This article is part of'
  ]

  const candidate = paragraphs.find(paragraph => paragraph.length > 70 && !ignoredPrefixes.some(prefix => paragraph.startsWith(prefix))) ?? paragraphs.find(paragraph => paragraph.length > 40) ?? ''

  return candidate.slice(0, 240).trim()
}

function getSlugFromLink(link: string, fallback: string, index: number) {
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

function formatPublicationName(hostname: string) {
  return hostname
    .replace(/^www\./, '')
    .replace(/\.com$/i, '')
    .split(/[.-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalisePost(item: Record<string, any>, index: number): MediumPost {
  const title = stripHtml(item.title ?? '')
  const link = String(item.link ?? '').trim()
  const content = String(item['content:encoded'] ?? '')

  const hostname = (() => {
    try {
      return new URL(link).hostname
    } catch {
      return 'medium.com'
    }
  })()

  return {
    author: stripHtml(item['dc:creator'] ?? siteConfig.author),
    excerpt: extractExcerpt(content),
    guid: typeof item.guid === 'string' ? item.guid : String(item.guid?.['#text'] ?? item.guid?.text ?? ''),
    imageUrl: extractImageUrl(content),
    link,
    publication: formatPublicationName(hostname),
    publishedAt: String(item.pubDate ?? ''),
    slug: getSlugFromLink(link, title, index),
    tags: Array.isArray(item.category) ?
      item.category.map((category: string) => stripHtml(String(category))) :
      item.category ?
        [stripHtml(String(item.category))] :
        [],
    title,
    updatedAt: String(item['atom:updated'] ?? item.pubDate ?? '')
  }
}

function parseFeed(xml: string) {
  const parsed = parser.parse(xml)
  const rawItems = parsed?.rss?.channel?.item
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  return items.map(normalisePost).filter(post => post.title && post.link)
}

async function loadMediumPosts() {
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
  } catch (error) {
    console.warn('Falling back to cached Medium posts.', error)

    return mediumPostsCache
  }
}

export async function getMediumPosts() {
  mediumPostsPromise ??= loadMediumPosts()

  return mediumPostsPromise
}

export async function getMediumPostBySlug(slug: string) {
  const posts = await getMediumPosts()

  return posts.find(post => post.slug === slug)
}
