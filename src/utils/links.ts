/** Returns the canonical URL path for a blog post, given its collection slug. */
export const getPostPath = (slug: string) => `/blog/${slug}/`

/** Returns the canonical URL path for a series index page. */
export const getSeriesPath = (slug: string) => `/blog/series/${slug}/`

/** Returns the canonical URL path for a portfolio project. */
export const getPortfolioPath = (slug: string) => `/portfolio/${slug}/`

/**
 * Returns the canonical URL path for a technology filter page.
 * The technology name is URI-encoded so values like "C#" or "C++" work
 * correctly as URL segments.
 */
export const getTechnologyPath = (technology: string) => `/technologies/${encodeURIComponent(technology)}/`
