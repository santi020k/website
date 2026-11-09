import type { SearchIndexEntry } from '@/types/search'

export interface FullTextHit {
  entry: SearchIndexEntry
  excerpt: string
}

export interface FullTextOutcome {
  hits: FullTextHit[]
  unavailable: boolean
}

interface SearchModule {
  destroy?: () => Promise<void> | void
  debouncedSearch: (query: string) => Promise<unknown>
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isSearchModule = (value: unknown): value is SearchModule => (
  isRecord(value) && typeof value.debouncedSearch === 'function' &&
  (value.destroy === undefined || typeof value.destroy === 'function')
)

const isResult = (value: unknown): value is { data: () => Promise<unknown> } => (
  isRecord(value) && typeof value.data === 'function'
)

const withTimeout = async <T>(promise: Promise<T>, milliseconds: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined

  const deadline = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Full-text search timed out'))
    }, milliseconds)
  })

  return Promise.race([promise, deadline]).finally(() => {
    clearTimeout(timer)
  })
}

/** Pagefind's plain_excerpt is entity-encoded; render the decoded value with textContent only. */
export const decodeSearchExcerpt = (excerpt: string): string => excerpt.replace(
  /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|#39);/giu,
  (entity: string, name: string) => {
    if (name.startsWith('#')) {
      const numeric = name.toLowerCase().startsWith('#x') ?
        Number.parseInt(name.slice(2), 16) :
        Number.parseInt(name.slice(1), 10)

      return numeric > 0 && numeric <= 0x10ffff && !(numeric >= 0xd800 && numeric <= 0xdfff) ?
        String.fromCodePoint(numeric) :
        entity
    }

    const entities: Record<string, string> = { amp: '&', apos: '\'', gt: '>', lt: '<', quot: '"' }

    return entities[name.toLowerCase()] ?? entity
  }
)

const loadModule = async (): Promise<unknown> => {
  const url = '/pagefind/pagefind.js'

  return import(/* @vite-ignore */ url)
}

/**
 * Optional body search. Every network boundary is bounded and failures resolve
 * to a degraded outcome, keeping the existing title/tag search usable. Only
 * published paths from the validated primary index can become result links.
 */
export const createFullTextSearch = (loader = loadModule, timeout = 5_000) => {
  let modulePromise: Promise<unknown> | undefined
  let activeLanguage: string | undefined

  return async (
    query: string,
    entries: readonly SearchIndexEntry[],
    shownPaths: ReadonlySet<string>,
    origin: string,
    language = 'en'
  ): Promise<FullTextOutcome> => {
    try {
      modulePromise ??= loader()

      const module = await withTimeout(modulePromise, timeout)

      if (!isSearchModule(module)) throw new TypeError('Invalid full-text search module')

      if (activeLanguage !== undefined && activeLanguage !== language) await module.destroy?.()

      activeLanguage = language

      const response = await withTimeout(module.debouncedSearch(query), timeout)

      // Pagefind cancels superseded debounced searches with null.
      if (response === null) return { hits: [], unavailable: false }

      if (!isRecord(response) || !Array.isArray(response.results) || !response.results.every(isResult)) {
        throw new TypeError('Invalid full-text search response')
      }

      const fragments = response.results.slice(0, 16).map(result => result.data())
      const records = await withTimeout(Promise.allSettled(fragments), timeout)
      const byPath = new Map(entries.map(entry => [entry.path, entry]))
      const seen = new Set(shownPaths)
      const hits: FullTextHit[] = []
      let unavailable = false

      for (const record of records) {
        if (record.status === 'rejected') {
          unavailable = true

          continue
        }

        const data = record.value

        if (!isRecord(data) || typeof data.url !== 'string' || typeof data.plain_excerpt !== 'string') continue

        const url = new URL(data.url, origin)

        if (url.origin !== origin) continue

        const path = url.pathname.replace(/index\.html$/u, '').replace(/\/$/u, '') + '/'
        const entry = byPath.get(path)

        if (!entry || seen.has(path)) continue

        seen.add(path)

        hits.push({ entry, excerpt: decodeSearchExcerpt(data.plain_excerpt) })

        if (hits.length === 5) break
      }

      return { hits, unavailable }
    } catch {
      // A later query may retry after a temporary module or chunk-fetch failure.
      modulePromise = undefined

      return { hits: [], unavailable: true }
    }
  }
}
