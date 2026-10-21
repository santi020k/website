interface ReadingEntry {
  id: string
  data: {
    draft: boolean
    publishDate: Date
    startHere?: { order: number } | undefined
  }
}

/** Curated reading stays published, deterministic, and separate from recency. */
export const getStartHerePosts = <T extends ReadingEntry>(posts: T[], now = new Date()): T[] => posts
  .filter(post => !post.data.draft && post.data.publishDate <= now && post.data.startHere)
  .sort((a, b) => (a.data.startHere?.order ?? 0) - (b.data.startHere?.order ?? 0) || a.id.localeCompare(b.id))
  .slice(0, 3)
