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

export const isSearchEntry = (value: unknown, origin: string): value is SearchIndexEntry => {
  if (!isRecord(value)) return false

  return typeof value.title === 'string' && value.title.trim().length > 0 &&
    typeof value.description === 'string' && isLocalPath(value.path, origin) &&
    Array.isArray(value.tags) && value.tags.every((tag: unknown) => typeof tag === 'string') &&
    typeof value.type === 'string' && ['community', 'post', 'project'].includes(value.type) &&
    (value.coverUrl === undefined || isLocalPath(value.coverUrl, origin)) &&
    (value.coverAvifUrl === undefined || isLocalPath(value.coverAvifUrl, origin))
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

// Combining Diacritical Marks (U+0300–U+036F) are the accents Latin, Greek,
// and Cyrillic text decomposes into under NFD. Marks from other blocks, such as
// Devanagari vowel signs or Arabic vowel signs, are left alone so those scripts
// keep their meaning instead of collapsing to bare consonants.
const latinDiacritics = /[\u0300-\u036F]/g

/**
 * Folds case and Latin accents so composed or NFD-decomposed "Aarón" and "AARON" compare
 * equal. Only used for matching; displayed text and the user's query keep
 * their original spelling.
 */
export const normalizeSearchText = (value: string): string => value
  .toLowerCase()
  .normalize('NFD')
  .replace(latinDiacritics, '')
  .normalize('NFC')
  .trim()

const MIN_SEARCH_QUERY_LENGTH = 2

/**
 * Applies the two-character minimum to the matched form, so a decomposed "é"
 * (two code units) is held to the same limit as its composed spelling.
 */
export const isSearchableQuery = (query: string): boolean => (
  normalizeSearchText(query).length >= MIN_SEARCH_QUERY_LENGTH
)

export const rankSearchEntry = (entry: SearchIndexEntry, query: string): number => {
  const normalizedQuery = normalizeSearchText(query)

  // A query made only of whitespace or combining marks would otherwise prefix
  // every title and match the whole index.
  if (!normalizedQuery) return 0

  const normalizedTitle = normalizeSearchText(entry.title)
  const normalizedDescription = normalizeSearchText(entry.description)
  const normalizedTags = entry.tags.map(normalizeSearchText)
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
