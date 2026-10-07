export interface SearchIndexEntry {
  coverAlt?: string
  coverAvifUrl?: string
  coverHeight?: number
  coverUrl?: string
  coverWidth?: number
  description: string
  path: string
  tags: string[]
  title: string
  type: 'community' | 'post' | 'project'
}
