export interface SearchIndexEntry {
  coverAvifUrl?: string
  coverUrl?: string
  description: string
  path: string
  tags: string[]
  title: string
  type: 'community' | 'post' | 'project'
}
