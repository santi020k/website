/**
 * Cached content collection helpers.
 *
 * During production builds, `getCollection` is called once per collection per
 * process lifetime and its pending result is stored in a module-level cache.
 * Failed loads are cleared so later calls can retry. In
 * development, each call delegates to Astro so content edits are reflected by
 * HMR instead of leaving the long-running dev server with stale entries.
 * Each caller receives its own array so route-specific sorting and filtering
 * cannot change the cached collection seen by other pages. Entry objects remain
 * shared and must be treated as read-only.
 *
 * Usage:
 *   import { getCachedPosts, getCachedProjects } from '@/utils/content'
 *   const posts = await getCachedPosts()       // returns non-draft posts sorted by date
 *   const projects = await getCachedProjects() // returns non-draft projects
 */
import { type CollectionEntry, getCollection } from 'astro:content'

/** Share pending build loads and retry failures; development always asks Astro for fresh content. */
const cacheCollection = <Entry>(load: () => Promise<Entry[]>) => {
  let pending: Promise<Entry[]> | null = null

  return async (): Promise<Entry[]> => {
    if (!import.meta.env.PROD) return [...await load()]

    pending ??= load().catch((error: unknown) => {
      pending = null

      throw error
    })

    return [...await pending]
  }
}

/** Returns published posts from newest to oldest, with drafts available during development. */
export const getCachedPosts = cacheCollection(async (): Promise<CollectionEntry<'post'>[]> => {
  const now = new Date()
  const all = await getCollection('post', ({ data }) => import.meta.env.PROD ? !data.draft && data.publishDate <= now : true)

  return [...all].sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  )
})

/** Returns published projects, with drafts available during development. */
export const getCachedProjects = cacheCollection(() => getCollection('project', ({ data }) => import.meta.env.PROD ? !data.draft : true))

/** Returns published series, with drafts available during development. */
export const getCachedSeries = cacheCollection(() => getCollection('series', ({ data }) => import.meta.env.PROD ? !data.draft : true))

/**
 * Returns posts that share at least one tag with the given tag list,
 * scored and sorted by number of shared tags then by publish date.
 * Excludes the current post and optionally an entire series.
 */
export const getRelatedPosts = async ({
  currentPostId,
  excludeSeriesId,
  limit = 3,
  tags
}: {
  currentPostId: string
  excludeSeriesId?: string
  limit?: number
  tags: string[]
}): Promise<CollectionEntry<'post'>[]> => {
  const posts = await getCachedPosts()
  const tagSet = new Set(tags)

  return posts
    .filter(p => {
      if (p.id === currentPostId) return false

      if (excludeSeriesId && p.data.seriesId === excludeSeriesId) return false

      return p.data.tags.some(t => tagSet.has(t))
    })
    .map(p => ({ post: p, sharedTags: p.data.tags.filter(t => tagSet.has(t)).length }))
    .sort((a, b) => b.sharedTags - a.sharedTags ||
      b.post.data.publishDate.getTime() - a.post.data.publishDate.getTime())
    .slice(0, limit)
    .map(item => item.post)
}

/**
 * Returns projects related by type and shared technologies.
 * Falls back to same-type projects even when no technology overlaps.
 */
export const getRelatedProjects = async ({
  currentProjectId,
  limit = 3,
  technologies,
  typesId
}: {
  currentProjectId: string
  limit?: number
  technologies: string[]
  typesId?: 'community' | 'experimental' | 'personal' | 'professional'
}): Promise<CollectionEntry<'project'>[]> => {
  const projects = await getCachedProjects()
  const technologySet = new Set(technologies)

  return projects
    .filter(project => {
      if (project.id === currentProjectId) return false

      if (typesId && project.data.typesId !== typesId) return false

      return true
    })
    .map(project => ({
      project,
      sharedTechnologies: project.data.technologies.filter(technology => technologySet.has(technology)).length
    }))
    .sort((a, b) => b.sharedTechnologies - a.sharedTechnologies ||
      b.project.data.startingDate.getTime() - a.project.data.startingDate.getTime())
    .slice(0, limit)
    .map(item => item.project)
}
