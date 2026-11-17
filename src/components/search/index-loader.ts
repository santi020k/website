import type { SearchIndexEntry } from '@/types/search'
import { getPopularTopics, isSearchEntry } from '@/utils/search'

import { getLocale } from '@/i18n'

export type IndexLoadState = 'idle' | 'loading' | 'ready' | 'error'

// A stalled request or body must reach the retry state instead of loading forever.
const INDEX_LOAD_TIMEOUT_MS = 10_000

/**
 * Loads the locale's search index once and keeps it across page swaps. Listeners
 * added with `onChange` run when loading starts and when it settles.
 */
export const createIndexLoader = () => {
  const listeners = new Set<() => void>()

  const onChange = () => {
    for (const listener of listeners) listener()
  }

  let entries: SearchIndexEntry[] = []
  let popularTopics: string[] = []
  let indexLocale = getLocale(window.location.pathname)
  let indexLoadState: IndexLoadState = 'idle'
  let indexLoadPromise: Promise<boolean> | null = null
  let indexLoadController: AbortController | null = null

  const load = async (options: { force?: boolean } = {}): Promise<boolean> => {
    const { force = false } = options
    const locale = getLocale(window.location.pathname)

    if (indexLocale !== locale) {
      indexLoadController?.abort()

      indexLocale = locale

      indexLoadState = 'idle'

      indexLoadPromise = null

      entries = []
    }

    // A valid empty index is still a successful load; reuse it until a full reload.
    if (!force && indexLoadState === 'ready') return true

    if (!force && indexLoadPromise) return indexLoadPromise

    // Only the newest request may update the shared index state.
    indexLoadController?.abort()

    const controller = new AbortController()
    const { signal } = controller

    const timeout = window.setTimeout(() => {
      controller.abort()
    }, INDEX_LOAD_TIMEOUT_MS)

    const isCurrent = () => indexLoadController === controller

    indexLoadController = controller

    indexLoadState = 'loading'

    onChange()

    // The deadline also covers reading the body, which a stalled stream can hold open.
    const aborted = new Promise<never>((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        reject(new Error('Search index request aborted'))
      }, { once: true })
    })

    const request = fetch(locale === 'es' ? '/es/search-index.json' : '/search-index.json', { signal })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed search index response')
        }

        return response.json()
      })

    const loading = Promise.race([request, aborted])
      .then((json: unknown) => {
        const isValidEntry = (entry: unknown): entry is SearchIndexEntry => isSearchEntry(entry, window.location.origin)

        if (!Array.isArray(json) || !json.every(isValidEntry)) {
          throw new TypeError('Invalid search index response')
        }

        if (!isCurrent()) return false

        entries = json

        popularTopics = getPopularTopics(entries)

        indexLoadState = 'ready'

        return true
      })
      .catch(() => {
        if (isCurrent()) {
          entries = []

          indexLoadState = 'error'
        }

        return false
      })
      .finally(() => {
        window.clearTimeout(timeout)

        if (!isCurrent()) return

        indexLoadController = null

        indexLoadPromise = null

        onChange()
      })

    indexLoadPromise = loading

    return loading
  }

  return {
    load,
    onChange: (listener: () => void) => {
      listeners.add(listener)
    },
    get entries(): readonly SearchIndexEntry[] {
      return entries
    },
    get popularTopics(): readonly string[] {
      return popularTopics
    },
    get state(): IndexLoadState {
      return indexLoadState
    }
  }
}
