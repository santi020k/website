export interface SearchIndexEntry {
  coverAvifUrl?: string
  coverUrl?: string
  description: string
  keywords?: string[]
  path: string
  tags: string[]
  title: string
  type: 'community' | 'page' | 'post' | 'project'
}
