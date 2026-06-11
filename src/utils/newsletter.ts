/**
 * Build-time fetch of the public Buttondown RSS feed so the `/newsletter/`
 * archive can list past issues without an API key. Failures (network, parse,
 * empty feed) degrade to an empty list — the page renders fine without it.
 */

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
  .replaceAll('&#39;', "'")
  .replaceAll('&amp;', '&')

const stripCdata = (value: string): string => value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const getTag = (block: string, tag: string): string => {
  const value = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`).exec(block)?.[1]

  return value ? stripCdata(value).trim() : ''
}

const MAX_DESCRIPTION_LENGTH = 280

const truncate = (value: string, max: number): string => (value.length <= max ? value : `${value.slice(0, max).replace(/\s+\S*$/, '')}…`)

export const parseNewsletterFeed = (xml: string): NewsletterIssue[] => {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  return items
    .map((block) => {
      const rawDate = getTag(block, 'pubDate')
      const parsedDate = rawDate ? new Date(rawDate) : undefined

      return {
        // Decode twice: once for the XML escaping, once for entities inside the embedded HTML.
        description: truncate(decodeEntities(stripHtml(decodeEntities(getTag(block, 'description')))), MAX_DESCRIPTION_LENGTH),
        link: decodeEntities(getTag(block, 'link')),
        pubDate: parsedDate && !Number.isNaN(parsedDate.valueOf()) ? parsedDate : undefined,
        title: stripHtml(decodeEntities(getTag(block, 'title')))
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
