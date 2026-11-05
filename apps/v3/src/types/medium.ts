/** A single Medium post entry (used in the Medium feed cache). */
export interface MediumPost {
  author: string
  excerpt: string
  guid: string
  imageUrl: null | string
  link: string
  publication: string
  publishedAt: string
  slug: string
  tags: string[]
  title: string
  updatedAt: string
}
