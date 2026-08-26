/**
 * Cached content collection helpers.
 *
 * During production builds, `getCollection` is called once per collection per
 * process lifetime and the result is stored in a module-level cache. In
 * development, each call delegates to Astro so content edits are reflected by
 * HMR instead of leaving the long-running dev server with stale entries.
 *
 * Usage:
 *   import { getCachedPosts, getCachedProjects } from '@/utils/content'
 *   const posts = await getCachedPosts()       // returns non-draft posts sorted by date
 *   const projects = await getCachedProjects() // returns non-draft projects
 */
import { type CollectionEntry, getCollection } from 'astro:content'

// Module-level caches — populated on first call, reused for the rest of the build.
let _posts: CollectionEntry<'post'>[] | null = null
let _projects: CollectionEntry<'project'>[] | null = null
let _series: CollectionEntry<'series'>[] | null = null

/**
 * Returns all published (non-draft) blog posts sorted from newest to oldest.
 * The result is cached for the duration of the Astro build process.
 */
export const getCachedPosts = async (): Promise<CollectionEntry<'post'>[]> => {
  if (import.meta.env.PROD && _posts) return _posts

  const now = new Date()
  const all = await getCollection('post', ({ data }) => import.meta.env.PROD ? !data.draft && data.publishDate <= now : true)

  const posts = all.sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  )

  if (import.meta.env.PROD) _posts = posts

  return posts
}

/**
 * Returns all published (non-draft) projects.
 * The result is cached for the duration of the Astro build process.
 */
export const getCachedProjects = async (): Promise<CollectionEntry<'project'>[]> => {
  if (import.meta.env.PROD && _projects) return _projects

  const projects = await getCollection('project', ({ data }) => import.meta.env.PROD ? !data.draft : true)

  if (import.meta.env.PROD) _projects = projects

  return projects
}

/**
 * Returns all series entries.
 * The result is cached for the duration of the Astro build process.
 */
export const getCachedSeries = async (): Promise<CollectionEntry<'series'>[]> => {
  if (import.meta.env.PROD && _series) return _series

  const series = await getCollection('series')

  if (import.meta.env.PROD) _series = series

  return series
}

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
