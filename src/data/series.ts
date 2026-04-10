import { getCachedPosts, getCachedSeries } from '@/utils/content'
import { getAdjacentSeriesPosts, sortSeriesPosts } from '@/utils/series'

import type { CollectionEntry } from 'astro:content'
import { getEntry } from 'astro:content'

export const getAllSeries = async (): Promise<CollectionEntry<'series'>[]> => {
  const series = await getCachedSeries()

  return [...series].sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title))
}

export const getSeriesPosts = async (seriesId: string): Promise<CollectionEntry<'post'>[]> => {
  const posts = await getCachedPosts()

  return sortSeriesPosts(posts.filter(p => p.data.seriesId === seriesId))
}

export const getSeriesSummaries = async () => {
  const [seriesEntries, posts] = await Promise.all([
    getAllSeries(),
    getCachedPosts()
  ])

  return seriesEntries.map(series => {
    const seriesPosts = sortSeriesPosts(posts.filter(post => post.data.seriesId === series.id))

    return {
      postCount: seriesPosts.length,
      posts: seriesPosts,
      series
    }
  })
}

export const getSeriesContext = async (post: CollectionEntry<'post'>) => {
  if (!post.data.seriesId) return null

  const [series, posts] = await Promise.all([
    getEntry('series', post.data.seriesId),
    getSeriesPosts(post.data.seriesId)
  ])

  if (!series || posts.length === 0) return null

  const { currentIndex, next, previous } = getAdjacentSeriesPosts(posts, post.id)

  return {
    next,
    position: currentIndex + 1,
    posts,
    previous,
    series,
    total: posts.length
  }
}
