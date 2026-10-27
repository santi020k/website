import { getPostSlug } from './posts'

/** Distinguishes a navigation destination from the section containing the current page. */
export const getNavigationCurrent = (pathname: string, path: string): 'page' | 'true' | undefined => {
  const route = pathname.endsWith('/') ? pathname : `${pathname}/`

  if (route === path) return 'page'

  return path !== '/' && route.startsWith(path) ? 'true' : undefined
}

/** Returns the canonical URL path for a blog post, given its collection slug. */
export const getPostPath = (id: string) => `/blog/${getPostSlug(id)}/`

/** Returns the canonical URL path for a series index page. */
export const getSeriesPath = (slug: string) => `/blog/series/${slug}/`

/** Returns the canonical URL path for a tag archive page. */
export const getTagPath = (tag: string) => `/blog/tags/${encodeURIComponent(tag)}/`

/** Returns the canonical URL path for a portfolio project. */
export const getPortfolioPath = (slug: string) => `/portfolio/${slug}/`

/**
 * Produces a stable, lowercase, hyphen-separated technology slug.
 */
export const getTechnologySlug = (technology: string) => technology
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replaceAll('&', ' and ')
  .replaceAll('+', ' plus ')
  .replaceAll('#', ' sharp ')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

/** Returns the canonical URL path for a technology filter page. */
export const getTechnologyPath = (technology: string) => `/technologies/${getTechnologySlug(technology)}/`
