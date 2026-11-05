import type { Element } from 'hast'

const protectedRel = ['noopener', 'noreferrer']
const thirdPartyRel = ['nofollow', ...protectedRel]
const ownedHost = /(?:^|\.)santi020k\.com$/u

/** First path segments that belong to Santiago's own profiles and packages, keyed by host. */
const ownedPaths: Record<string, (segments: string[]) => boolean> = {
  'github.com': ([owner]) => owner === 'santi020k',
  'linkedin.com': ([section, profile]) => section === 'in' && profile === 'santi020k',
  'medium.com': ([profile]) => profile === '@santi020k',
  'npmjs.com': ([section, scope]) => section === 'package' && scope === '@santi020k',
  'twitter.com': ([profile]) => profile === 'santi020k',
  'x.com': ([profile]) => profile === 'santi020k'
}

/**
 * Whether an absolute link points to one of Santiago's own sites, profiles, or packages.
 * Those destinations should receive search signals from the articles that cite them.
 */
export const isOwnedDestination = (href: string): boolean => {
  let url: URL

  try {
    url = new URL(href)
  } catch {
    return false
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false

  const host = url.hostname.toLowerCase().replace(/^www\./u, '')

  if (ownedHost.test(host)) return true

  const segments = url.pathname.split('/').filter(Boolean).map(segment => {
    try {
      return decodeURIComponent(segment).toLowerCase()
    } catch {
      return segment.toLowerCase()
    }
  })

  return ownedPaths[host]?.(segments) ?? false
}

/**
 * `rel` values for external Markdown links. Every external link keeps new-tab protection;
 * only third-party destinations are marked `nofollow`.
 */
export const externalLinkRel = (element: Element): string[] => {
  const { href } = element.properties

  return typeof href === 'string' && isOwnedDestination(href) ? [...protectedRel] : [...thirdPartyRel]
}
