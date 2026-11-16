import { isSearchableQuery, normalizeRecentSearches } from '@/utils/search'

const RECENT_SEARCHES_KEY = 'site-search-recent'

type RecentSearchStorage = Pick<Storage, 'getItem' | 'setItem'>

// Reading `window.localStorage` itself can throw (blocked storage), so it stays inside each try.
const defaultStorage = (): RecentSearchStorage => window.localStorage

/** Reads validate in memory only; storage is rewritten when a search is remembered. */
export const getRecentSearches = (storage: () => RecentSearchStorage = defaultStorage): string[] => {
  try {
    const raw = storage().getItem(RECENT_SEARCHES_KEY)

    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    return normalizeRecentSearches(parsed)
  } catch {
    return []
  }
}

export const rememberRecentSearch = (query: string, storage: () => RecentSearchStorage = defaultStorage) => {
  const trimmed = query.trim()

  if (!isSearchableQuery(trimmed)) return

  try {
    const next = normalizeRecentSearches([trimmed, ...getRecentSearches(storage)])

    storage().setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  } catch {
    /* localStorage may be unavailable (private mode); fail silently. */
  }
}
