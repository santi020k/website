interface SeriesPostLike {
  id: string
  data: {
    publishDate: Date
    seriesOrder?: number
  }
}

export function sortSeriesPosts<T extends SeriesPostLike>(posts: T[]) {
  return [...posts].sort((a, b) => {
    const orderDiff = (a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER)

    if (orderDiff !== 0) return orderDiff

    return a.data.publishDate.getTime() - b.data.publishDate.getTime()
  })
}

export function getAdjacentSeriesPosts<T extends { id: string }>(posts: T[], currentPostId: string) {
  const currentIndex = posts.findIndex(post => post.id === currentPostId)

  return {
    currentIndex,
    next: currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : undefined,
    previous: currentIndex > 0 ? posts[currentIndex - 1] : undefined
  }
}
