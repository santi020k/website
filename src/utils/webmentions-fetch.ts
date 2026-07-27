import type { WebmentionsChildren } from '@/types/webmentions'

interface Jf2Feed {
  children?: WebmentionsChildren[]
}

/**
 * Loads public webmentions for a canonical page URL from webmention.io (build time).
 * Requires `WEBMENTION_API_KEY` (API token from the webmention.io dashboard).
 */
export const fetchWebmentionsForTarget = async (
  targetUrl: string,
  token: string
): Promise<WebmentionsChildren[]> => {
  const endpoint = new URL('https://webmention.io/api/mentions.jf2')

  endpoint.searchParams.set('target', targetUrl)

  endpoint.searchParams.set('token', token)

  let response: Response

  try {
    response = await fetch(endpoint.href, {
      headers: { Accept: 'application/jf2+json, application/json' },
      signal: AbortSignal.timeout(12_000)
    })
  } catch {
    return []
  }

  if (!response.ok) {
    return []
  }

  let data: unknown

  try {
    data = await response.json()
  } catch {
    return []
  }

  const raw = (data as Jf2Feed).children

  if (!Array.isArray(raw)) {
    return []
  }

  const rows = raw as unknown[]

  return rows.filter((entry): entry is WebmentionsChildren => {
    if (typeof entry !== 'object' || entry === null) {
      return false
    }

    const mention = entry as WebmentionsChildren

    if (mention['wm-private']) {
      return false
    }

    return typeof mention['wm-property'] === 'string'
  })
}
