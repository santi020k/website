export const getPostPath = (slug: string) => `/posts/${slug}/`

export const getProjectPath = (slug: string) => `/portfolio/${slug}/`

export const getTechnologyPath = (technology: string) => `/technologies/${encodeURIComponent(technology)}/`
