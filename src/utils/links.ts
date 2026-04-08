export const getPostPath = (slug: string) => `/blog/${slug}/`

export const getSeriesPath = (slug: string) => `/blog/series/${slug}/`

export const getPortfolioPath = (slug: string) => `/portfolio/${slug}/`

export const getTechnologyPath = (technology: string) => `/technologies/${encodeURIComponent(technology)}/`
