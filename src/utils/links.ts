export const getPostPath = (slug: string) => `/blog/${slug}/`

export const getProjectPath = (slug: string) => `/projects/${slug}/`

export const getTechnologyPath = (technology: string) => `/technologies/${encodeURIComponent(technology)}/`
