/** Current-site locales. Historical site archives retain their original language. */
import { sharedCopy } from './shared-copy'

export const locales = ['en', 'es'] as const
export type Locale = typeof locales[number]

export const getLocale = (pathname: string): Locale => /^\/es(?:\/|$)/u.test(pathname) ? 'es' : 'en'
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

/** Exact English source copy keeps the default locale unchanged. */
export const translate = (
  locale: Locale,
  text: string,
  values: Readonly<Record<string, number | string>> = {}
): string => {
  const translated = locale === 'es' ? sharedCopy[text] ?? text : text

  return translated.replace(/\{(\w+)\}/gu, (placeholder: string, name: string) => String(values[name] ?? placeholder))
}
