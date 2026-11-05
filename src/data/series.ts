import type { CollectionEntry } from 'astro:content'

import { getCachedPosts, getCachedSeries } from '@/utils/content'
import { getReadingTime } from '@/utils/reading-time'
import { getAdjacentSeriesPosts, sortSeriesPosts } from '@/utils/series'

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

  return seriesEntries.flatMap(series => {
    const seriesPosts = sortSeriesPosts(posts.filter(post => post.data.seriesId === series.id))

    if (import.meta.env.PROD && seriesPosts.length === 0) return []

    return [{
      postCount: seriesPosts.length,
      posts: seriesPosts,
      readingMinutes: seriesPosts.reduce((minutes, post) => minutes + getReadingTime(post.body), 0),
      series
    }]
  })
}

export const getSeriesContext = async (post: CollectionEntry<'post'>) => {
  if (!post.data.seriesId) return null

  const [seriesEntries, posts] = await Promise.all([
    getCachedSeries(),
    getSeriesPosts(post.data.seriesId)
  ])

  const series = seriesEntries.find(entry => entry.id === post.data.seriesId)

  if (!series || posts.length === 0) return null

  const { currentIndex, next, previous } = getAdjacentSeriesPosts(posts, post.id)

  if (currentIndex < 0) return null

  return {
    next,
    position: currentIndex + 1,
    posts,
    previous,
    series,
    total: posts.length
  }
}
