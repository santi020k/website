import { getAllTags, getBlogTopicLabel } from './tags'

interface SeriesPostLike {
  id: string
  data: {
    publishDate: Date
    seriesOrder?: number | undefined
  }
}

/** Preserve authored focus labels; resolve only unambiguous, published topic archives. */
export const getSeriesFocusAreas = (
  areas: readonly string[],
  posts: { data: { draft?: boolean, publishDate: Date, tags: string[] } }[],
  now = new Date()
) => {
  const normalize = (label: string) => label.normalize('NFKC').toLowerCase().replace(/[\s./_-]/gu, '')
  const topics = getAllTags(posts.filter(post => !post.data.draft && post.data.publishDate <= now))

  return areas.map(label => {
    const matches = topics.filter(([tag]) => normalize(getBlogTopicLabel(tag)) === normalize(label))

    return { label, tag: matches.length === 1 ? matches[0]?.[0] : undefined }
  })
}

export const sortSeriesPosts = <T extends SeriesPostLike>(posts: T[]) => [...posts].sort((a, b) => {
  const orderDiff = (a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER)

  if (orderDiff !== 0) return orderDiff

  return a.data.publishDate.getTime() - b.data.publishDate.getTime()
})

export const getAdjacentSeriesPosts = <T extends { id: string }>(posts: T[], currentPostId: string) => {
  const currentIndex = posts.findIndex(post => post.id === currentPostId)

  return {
    currentIndex,
    next: currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : undefined,
    previous: currentIndex > 0 ? posts[currentIndex - 1] : undefined
  }
}
