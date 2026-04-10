/**
 * Cached content collection helpers.
 *
 * `getCollection` is called once per collection per process lifetime and the
 * result is stored in a module-level cache.  Subsequent callers within the
 * same Astro build receive the same array without triggering another FS read,
 * which is especially useful when multiple components query posts on the same
 * page (e.g. PostCard + RelatedPosts + SeriesNavigator).
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
  if (_posts) return _posts

  const all = await getCollection('post', ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true
  })

  _posts = all.sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  )

  return _posts
}

/**
 * Returns all published (non-draft) projects.
 * The result is cached for the duration of the Astro build process.
 */
export const getCachedProjects = async (): Promise<CollectionEntry<'project'>[]> => {
  if (_projects) return _projects

  _projects = await getCollection('project', ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true
  })

  return _projects
}

/**
 * Returns all series entries.
 * The result is cached for the duration of the Astro build process.
 */
export const getCachedSeries = async (): Promise<CollectionEntry<'series'>[]> => {
  if (_series) return _series

  _series = await getCollection('series')

  return _series
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
    .sort((a, b) => b.sharedTags - a.sharedTags || b.post.data.publishDate.getTime() - a.post.data.publishDate.getTime())
    .slice(0, limit)
    .map(item => item.post)
}
