/**
 * Build-time fetch of the public Buttondown RSS feed so the `/newsletter/`
 * archive can list past issues without an API key. Failures (network, parse,
 * empty feed) degrade to an empty list — the page renders fine without it.
 */

import { XMLParser } from 'fast-xml-parser'

export interface NewsletterIssue {
  description: string
  link: string
  pubDate: Date | undefined
  title: string
}

const decodeEntities = (value: string): string => value
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', '\'')
  .replaceAll('&amp;', '&')

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: true,
  trimValues: true
})

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const toArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.filter(isRecord)
  }

  return isRecord(value) ? [value] : []
}

const textValue = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim()
  }

  return ''
}

const getItemValue = (
  item: Record<string, unknown>,
  key: 'description' | 'link' | 'pubDate' | 'title'
): string => {
  switch (key) {
    case 'description':
      return textValue(item.description)

    case 'link':
      return textValue(item.link)

    case 'pubDate':
      return textValue(item.pubDate)

    case 'title':
      return textValue(item.title)
  }
}

const getFeedItems = (xml: string): Record<string, unknown>[] => {
  const parsed = parser.parse(xml) as unknown

  if (!isRecord(parsed) || !isRecord(parsed.rss) || !isRecord(parsed.rss.channel)) {
    return []
  }

  return toArray(parsed.rss.channel.item)
}

const MAX_DESCRIPTION_LENGTH = 280
const truncate = (value: string, max: number): string => (value.length <= max ? value : `${value.slice(0, max).replace(/\s+\S*$/, '')}…`)

export const parseNewsletterFeed = (xml: string): NewsletterIssue[] => {
  const items = getFeedItems(xml)

  return items
    .map(item => {
      const rawDate = getItemValue(item, 'pubDate')
      const parsedDate = rawDate ? new Date(rawDate) : undefined

      return {
        // Decode twice: once for the XML escaping, once for entities inside the embedded HTML.
        description: truncate(
          decodeEntities(stripHtml(decodeEntities(getItemValue(item, 'description')))), MAX_DESCRIPTION_LENGTH
        ),
        link: decodeEntities(getItemValue(item, 'link')),
        pubDate: parsedDate && !Number.isNaN(parsedDate.valueOf()) ? parsedDate : undefined,
        title: stripHtml(decodeEntities(getItemValue(item, 'title')))
      }
    })
    .filter(issue => issue.title.length > 0 && issue.link.length > 0)
    .sort((a, b) => (b.pubDate?.valueOf() ?? 0) - (a.pubDate?.valueOf() ?? 0))
}

const FETCH_TIMEOUT_MS = 15_000

export const fetchNewsletterIssues = async (feedUrl: string): Promise<NewsletterIssue[]> => {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        accept: 'application/rss+xml, application/xml, text/xml',
        'user-agent': 'santi020k.com static build (+https://santi020k.com/newsletter/)'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })

    if (!response.ok) {
      console.warn(`[newsletter] Feed request failed with ${response.status} — rendering archive without issues.`)

      return []
    }

    return parseNewsletterFeed(await response.text())
  } catch (error) {
    console.warn('[newsletter] Could not fetch the feed — rendering archive without issues.', error)

    return []
  }
}
