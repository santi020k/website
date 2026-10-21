import type { SearchIndexEntry } from '@/types/search'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const isLocalPath = (value: unknown, origin: string): value is string => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return false
  }

  try {
    return new URL(value, origin).origin === origin
  } catch {
    return false
  }
}

const isImageDimension = (value: unknown) => value === undefined ||
  (typeof value === 'number' && Number.isInteger(value) && value > 0)

export const isSearchEntry = (value: unknown, origin: string): value is SearchIndexEntry => {
  if (!isRecord(value)) return false

  return typeof value.title === 'string' && value.title.trim().length > 0 &&
    typeof value.description === 'string' && isLocalPath(value.path, origin) &&
    Array.isArray(value.tags) && value.tags.every((tag: unknown) => typeof tag === 'string') &&
    typeof value.type === 'string' && ['community', 'post', 'project'].includes(value.type) &&
    (value.coverAlt === undefined || typeof value.coverAlt === 'string') &&
    (value.coverUrl === undefined || isLocalPath(value.coverUrl, origin)) &&
    (value.coverAvifUrl === undefined || isLocalPath(value.coverAvifUrl, origin)) &&
    isImageDimension(value.coverWidth) && isImageDimension(value.coverHeight)
}

export const getPopularTopics = (entries: readonly SearchIndexEntry[]): string[] => {
  // Blog tags ("typescript") and project technologies ("TypeScript") name the
  // same topic with different casing; merge them by lowercase key so the list
  // doesn't show visible near-duplicates, keeping whichever casing reads best.
  const counts = new Map<string, { count: number, label: string, upperCount: number }>()

  for (const entry of entries) {
    for (const tag of entry.tags) {
      const key = tag.toLowerCase()
      const upperCount = (tag.match(/[A-Z]/g) ?? []).length
      const existing = counts.get(key)

      if (existing) {
        existing.count += 1

        if (upperCount > existing.upperCount) {
          existing.label = tag

          existing.upperCount = upperCount
        }
      } else {
        counts.set(key, { count: 1, label: tag, upperCount })
      }
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8)
    .map(entry => entry.label)
}

export const rankSearchEntry = (entry: SearchIndexEntry, normalizedQuery: string): number => {
  const normalizedTitle = entry.title.toLowerCase()
  const normalizedDescription = entry.description.toLowerCase()
  const normalizedTags = entry.tags.map(tag => tag.toLowerCase())
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)
  let score = 0

  if (normalizedTitle === normalizedQuery) score += 120

  if (normalizedTitle.startsWith(normalizedQuery)) score += 90
  else if (normalizedTitle.includes(normalizedQuery)) score += 55

  if (normalizedTags.some(tag => tag === normalizedQuery)) score += 48
  else if (normalizedTags.some(tag => tag.startsWith(normalizedQuery))) score += 36

  if (normalizedDescription.includes(normalizedQuery)) score += 16

  for (const term of terms) {
    let termMatched = false

    if (normalizedTitle.startsWith(term)) {
      score += 22

      termMatched = true
    } else if (normalizedTitle.includes(term)) {
      score += 14

      termMatched = true
    }

    if (normalizedTags.some(tag => tag === term)) {
      score += 16

      termMatched = true
    } else if (normalizedTags.some(tag => tag.startsWith(term))) {
      score += 11

      termMatched = true
    } else if (normalizedTags.some(tag => tag.includes(term))) {
      score += 7

      termMatched = true
    }

    if (normalizedDescription.includes(term)) {
      score += 6

      termMatched = true
    }

    if (!termMatched) return 0
  }

  return score
}
