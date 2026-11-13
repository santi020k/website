/** Current-site locales. Historical site archives retain their original language. */
import type { Locale } from './locale.ts'
import { defaultLocale } from './locale.ts'

export type { Locale } from './locale.ts'
export { defaultLocale, locales } from './locale.ts'
export { sharedTranslator } from './shared-copy.ts'

export const getLocale = (pathname: string): Locale => /^\/es(?:\/|$)/u.test(pathname) ? 'es' : defaultLocale
export const stripLocale = (pathname: string): string => pathname.replace(/^\/es(?=\/|$)/u, '') || '/'
export const localeLanguage = (locale: Locale): string => locale === 'es' ? 'es-419' : 'en-US'
export const localeOg = (locale: Locale): string => locale === 'es' ? 'es_CO' : 'en_US'

const translatedRoots = new Set(['', 'about', 'work', 'resume', 'speaking', 'privacy', 'terms', 'accessibility', 'travel', 'history', 'developer-experience', 'blog', 'projects', 'portfolio', 'technologies', 'offline', '404', 'work-with-me'])

/** Only page routes are localized. Downloads, feeds, endpoints and archives stay canonical. */
export const hasTranslation = (path: string): boolean => {
  if (!path.startsWith('/') || path.startsWith('//')) return false

  const pathname = stripLocale(path.split(/[?#]/u)[0] ?? '/')
  const first = pathname.split('/')[1] ?? ''

  return translatedRoots.has(first) && !/\.[a-z\d]+$/iu.test(pathname)
}

/** Each language has its own feeds; the Spanish ones list only translated articles. */
export const getFeedPath = (locale: Locale, format: 'json' | 'xml' = 'xml') => `${locale === 'es' ? '/es' : ''}/feed.${format}`

/** Match the existing Giscus pathname term so locales share the same discussion. */
export const getDiscussionTerm = (pathname: string): string => {
  const canonical = stripLocale(pathname)

  return canonical.length < 2 ? 'index' : canonical.substring(1).replace(/\.\w+$/u, '')
}

/** Preserve query strings/fragments and make localization idempotent. */
export const localizePath = (path: string, locale: Locale): string => {
  if (!hasTranslation(path)) return path

  const base = stripLocale(path)

  return locale === 'es' ? `/es${base.startsWith('/') ? base : `/${base}`}` : base
}
