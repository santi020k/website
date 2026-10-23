import type { SearchIndexEntry } from '@/types/search'
import { getPopularTopics, isSearchableQuery, isSearchEntry, rankSearchEntry } from '@/utils/search'

let entries: SearchIndexEntry[] = []
let selectedResultIndex = -1
let searchURL = window.location.href
let closeAnimTimer = 0
let closeAnimPanel: HTMLElement | null = null
let closeAnimHandler: ((event: AnimationEvent) => void) | null = null
let indexLoadState: 'idle' | 'loading' | 'ready' | 'error' = 'idle'
let indexLoadPromise: Promise<boolean> | null = null
let indexLoadController: AbortController | null = null
let popularTopics: string[] = []
// A stalled request or body must reach the retry state instead of loading forever.
const INDEX_LOAD_TIMEOUT_MS = 10_000
const RECENT_SEARCHES_KEY = 'site-search-recent'
const RECENT_SEARCHES_LIMIT = 5

const getRecentSearches = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)

    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed.filter((value: unknown): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

const rememberRecentSearch = (query: string) => {
  const trimmed = query.trim()

  if (!isSearchableQuery(trimmed)) return

  try {
    const list = getRecentSearches().filter(v => v.toLowerCase() !== trimmed.toLowerCase())

    list.unshift(trimmed)

    const next = list.slice(0, RECENT_SEARCHES_LIMIT)

    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  } catch {
    /* localStorage may be unavailable (private mode); fail silently. */
  }
}

const getDialog = () => document.querySelector<HTMLDialogElement>('#site-search-dialog')
const getInput = () => document.querySelector<HTMLInputElement>('#site-search-input')
const getResults = () => document.querySelector<HTMLElement>('#site-search-results')
const getStatus = () => document.querySelector('#site-search-status')
const getTrigger = () => document.querySelector('[data-site-search-trigger]')
const getPanel = () => document.querySelector('[data-site-search-panel]')

const setScrollLock = (locked: boolean) => {
  document.documentElement.classList.toggle('site-search-open', locked)

  document.body.classList.toggle('site-search-open', locked)
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
/**
 * Keep the documented legacy IME sentinel at this compatibility boundary.
 * Composition can start after, or end before, its keydown event, leaving
 * isComposing false. Retire this fallback when browsers expose that state.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event#keydown_events_with_ime
 */
const isComposingKey = (event: { isComposing: boolean, keyCode: number }) => event.isComposing || event.keyCode === 229

const setTriggerExpanded = (open: boolean) => {
  const trigger = getTrigger()

  if (trigger instanceof HTMLButtonElement) {
    trigger.setAttribute('aria-expanded', String(open))
  }
}

const syncResultSelection = () => {
  const results = getResults()

  if (!results) return

  const anchors = results.querySelectorAll('a[href]')

  anchors.forEach((a, i) => {
    if (i === selectedResultIndex) {
      a.setAttribute('data-site-search-active', 'true')

      a.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      })
    } else {
      a.removeAttribute('data-site-search-active')
    }
  })
}

const setStatusMessage = (message: string) => {
  const status = getStatus()

  if (!(status instanceof HTMLElement)) return

  if (status.textContent === message) return

  status.textContent = message
}

/**
 * Announces the highlighted result while keyboard focus remains in the input.
 */
const describeResultAt = (index: number, total: number): string => {
  const results = getResults()

  if (!results) return ''

  const anchors = [...results.querySelectorAll('a[href]')]
  const title = anchors[index]?.querySelector('[data-site-search-result-title]')?.textContent.trim()

  if (!title) return ''

  return `${title}, ${index + 1} of ${total}`
}

/**
 * Renders the empty state shown before the user starts typing. Prefers a
 * "Recent searches" list when localStorage has prior queries, otherwise
 * falls back to "Popular topics" derived from the loaded index.
 */
const renderEmptyState = (results: HTMLElement) => {
  const recentSearches = getRecentSearches()
  const hasRecentSearches = recentSearches.length > 0
  const items = hasRecentSearches ? recentSearches : popularTopics

  if (items.length === 0) {
    results.innerHTML = `
      <li class="
        site-search-hint flex flex-col items-center justify-center gap-3
        px-4 py-10 text-center
      ">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted/80 text-ink-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M11 8v6" />
            <path d="M8 11h6" />
          </svg>
        </span>
        <div class="space-y-1">
          <p class="text-sm font-medium text-ink">Start typing to search</p>
          <p class="text-xs text-ink-soft">Enter at least 2 characters to find posts, projects, and community work.</p>
        </div>
      </li>
    `

    setStatusMessage('Type at least two characters to search.')

    return
  }

  const heading = hasRecentSearches ? 'Recent searches' : 'Popular topics'
  const li = document.createElement('li')

  li.className = 'site-search-hint'

  const label = document.createElement('div')

  label.setAttribute('data-site-search-group-title', '')

  label.textContent = heading

  li.appendChild(label)

  const chips = document.createElement('div')

  chips.setAttribute('data-site-search-topics', '')

  for (const [index, item] of items.entries()) {
    const chip = document.createElement('button')

    chip.type = 'button'

    chip.dataset.siteSearchSuggestion = item

    const number = document.createElement('span')

    number.setAttribute('aria-hidden', 'true')

    number.textContent = String(index + 1).padStart(2, '0')

    const text = document.createElement('span')

    text.textContent = item

    chip.append(number, text)

    chips.appendChild(chip)
  }

  li.appendChild(chips)

  results.innerHTML = ''

  results.appendChild(li)

  setStatusMessage(`${items.length} ${heading.toLowerCase()} available.`)
}

const render = (query: string) => {
  const results = getResults()

  if (!results) return

  results.innerHTML = ''

  const trimmed = query.trim()

  if (indexLoadState === 'loading') {
    selectedResultIndex = -1

    results.innerHTML = `
      <li class="
        site-search-hint flex flex-col items-center justify-center gap-3
        px-4 py-8 text-center
      ">
        <span class="relative flex h-8 w-8">
          <span class="absolute inset-0 rounded-full border-2 border-line/30"></span>
          <span
            class="absolute inset-0 animate-spin rounded-full border-2 border-brand/60 border-t-transparent motion-reduce:animate-none"
          ></span>
        </span>
        <span class="text-sm text-ink-soft">Loading search index…</span>
      </li>
    `

    setStatusMessage('Loading search index.')

    return
  }

  if (indexLoadState === 'error') {
    selectedResultIndex = -1

    results.innerHTML = `
      <li
        class="
          site-search-hint flex flex-col items-center justify-center gap-4
          px-4 py-8 text-center
        "
      >
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </span>
        <div class="space-y-1">
          <p class="text-sm font-medium text-ink">Search unavailable</p>
          <p class="text-xs text-ink-soft">We couldn't load the search index.</p>
        </div>
        <button
          class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface-muted px-4 py-2 text-xs font-medium text-ink"
          data-site-search-retry
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          Try again
        </button>
      </li>
    `

    setStatusMessage('Search is temporarily unavailable.')

    return
  }

  if (!isSearchableQuery(trimmed)) {
    selectedResultIndex = -1

    renderEmptyState(results)

    return
  }

  const matches = entries
    .map(entry => {
      const score = rankSearchEntry(entry, trimmed)

      return { entry, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score

      const typeOrder = { community: 0, project: 1, post: 2 }
      const typeDiff = typeOrder[a.entry.type] - typeOrder[b.entry.type]

      if (typeDiff !== 0) return typeDiff

      return a.entry.title.localeCompare(b.entry.title)
    })
    .slice(0, 8)

  if (matches.length === 0) {
    selectedResultIndex = -1

    results.innerHTML = `
      <li class="
        site-search-hint flex flex-col items-center justify-center gap-3
        px-4 py-10 text-center
      ">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted/80 text-ink-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="m8 8 6 6" />
            <path d="m14 8-6 6" />
          </svg>
        </span>
        <div class="space-y-1">
          <p class="text-sm font-medium text-ink">No results found</p>
          <p class="text-xs text-ink-soft">Try different keywords or check your spelling.</p>
        </div>
        <button
          type="button"
          data-site-search-clear
          class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface-muted px-4 py-2 text-xs font-medium text-ink"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Clear search
        </button>
      </li>
    `

    setStatusMessage(`No matching results for ${trimmed}. Try different keywords.`)

    return
  }

  selectedResultIndex = Math.min(Math.max(selectedResultIndex, 0), matches.length - 1)

  for (const match of matches) {
    const e = match.entry
    const li = document.createElement('li')
    const a = document.createElement('a')

    a.href = e.path

    a.setAttribute('data-site-search-result', '')

    const thumbHost = document.createElement('span')

    thumbHost.setAttribute('data-site-search-thumb-frame', '')

    if (e.coverUrl) {
      const placeholder = document.createElement('span')

      placeholder.setAttribute('aria-hidden', 'true')

      placeholder.setAttribute('data-site-search-thumb-placeholder', '')

      const picture = document.createElement('picture')

      if (e.coverAvifUrl) {
        const avifSource = document.createElement('source')

        avifSource.type = 'image/avif'

        avifSource.srcset = e.coverAvifUrl

        picture.appendChild(avifSource)
      }

      const img = document.createElement('img')

      img.src = e.coverUrl

      // The adjacent title already names this link; artwork is decorative.
      img.alt = ''

      img.decoding = 'async'

      img.loading = 'eager'

      img.setAttribute('data-site-search-thumb', '')

      img.setAttribute('data-site-search-thumb-state', 'loading')

      img.addEventListener('load', () => {
        img.setAttribute('data-site-search-thumb-state', 'loaded')

        thumbHost.setAttribute('data-site-search-thumb-loaded', 'true')
      })

      img.addEventListener('error', () => {
        img.setAttribute('data-site-search-thumb-state', 'error')

        thumbHost.removeAttribute('data-site-search-thumb-loaded')

        img.alt = ''
      })

      picture.appendChild(img)

      thumbHost.append(placeholder, picture)
    } else {
      const ph = document.createElement('span')

      ph.className = 'block size-full grid-fade'

      ph.setAttribute('aria-hidden', 'true')

      thumbHost.appendChild(ph)
    }

    const body = document.createElement('span')

    body.className = 'flex min-w-0 flex-1 flex-col justify-center gap-0.5'

    const typeEl = document.createElement('span')

    typeEl.setAttribute('data-site-search-result-type', '')

    let resultTypeLabel = 'Project'

    if (e.type === 'post') {
      resultTypeLabel = 'Post'
    } else if (e.type === 'community') {
      resultTypeLabel = 'Community'
    }

    typeEl.textContent = resultTypeLabel

    const titleEl = document.createElement('span')

    titleEl.setAttribute('data-site-search-result-title', '')

    titleEl.textContent = e.title

    const descEl = document.createElement('span')

    descEl.className = 'line-clamp-2 text-xs/5 text-ink-soft'

    descEl.textContent = e.description

    body.append(typeEl, titleEl, descEl)

    a.append(thumbHost, body)

    li.appendChild(a)

    results.appendChild(li)
  }

  syncResultSelection()

  setStatusMessage(
    `${matches.length} ${matches.length === 1 ? 'result' : 'results'} available. Use arrow keys to navigate.`
  )
}

// Keep only one close cycle alive so a stale callback cannot close a reopened dialog.
const cancelPendingClose = () => {
  window.clearTimeout(closeAnimTimer)

  closeAnimTimer = 0

  if (closeAnimHandler) {
    closeAnimPanel?.removeEventListener('animationend', closeAnimHandler)

    closeAnimHandler = null
  }

  closeAnimPanel = null
}

const syncQueryInURL = (value: string) => {
  const url = new URL(window.location.href)
  const query = value.trim()

  if (isSearchableQuery(query)) {
    url.searchParams.set('q', query)
  } else {
    url.searchParams.delete('q')
  }

  // Astro keeps its navigation index and scroll restoration in this state.
  if (url.href !== window.location.href) {
    window.history.replaceState(window.history.state, '', url)
  }

  searchURL = url.href
}

const openSearch = () => {
  const dialog = getDialog()
  const input = getInput()

  if (!(dialog instanceof HTMLDialogElement) || !(input instanceof HTMLInputElement)) return

  syncQueryInURL(input.value)

  cancelPendingClose()

  dialog.removeAttribute('data-site-search-anim')

  if (!dialog.open) {
    dialog.showModal()
  }

  setScrollLock(true)

  setTriggerExpanded(true)

  window.requestAnimationFrame(() => {
    input.focus()

    input.select()

    render(input.value)
  })
}

const closeSearch = (options: { focusTrigger?: boolean } = {}) => {
  const { focusTrigger = false } = options
  const dialog = getDialog()

  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return

  // A page swap can cancel the close animation before the native close event.
  // Clear the source history entry now so Back does not reopen the dialog.
  syncQueryInURL('')

  cancelPendingClose()

  const finish = () => {
    cancelPendingClose()

    if (dialog.open) {
      dialog.close()
    }

    setScrollLock(false)

    /* Remove after `close()` so `[open]` never pairs with "not closing" (intro CSS). */
    dialog.removeAttribute('data-site-search-anim')

    if (focusTrigger) {
      const t = getTrigger()

      if (t instanceof HTMLElement) {
        t.focus()
      }
    }
  }

  if (prefersReducedMotion()) {
    finish()

    return
  }

  const panel = getPanel()

  if (!(panel instanceof HTMLElement)) {
    finish()

    return
  }

  dialog.setAttribute('data-site-search-anim', 'closing')

  const onAnimEnd = (e: AnimationEvent) => {
    if (e.animationName !== 'site-search-panel-out') return

    finish()
  }

  closeAnimPanel = panel

  closeAnimHandler = onAnimEnd

  panel.addEventListener('animationend', onAnimEnd)

  closeAnimTimer = window.setTimeout(finish, 420)
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  if (target.isContentEditable) return true

  const tag = target.tagName

  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true

  return false
}

const loadIndex = async (options: { force?: boolean } = {}): Promise<boolean> => {
  const { force = false } = options

  if (!force && indexLoadState === 'ready' && entries.length > 0) return true

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

  render(getInput()?.value ?? '')

  // The deadline also covers reading the body, which a stalled stream can hold open.
  const aborted = new Promise<never>((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('Search index request aborted'))
    }, { once: true })
  })

  const request = fetch('/search-index.json', { signal })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed search index response')
      }

      return response.json()
    })

  const load = Promise.race([request, aborted])
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

      render(getInput()?.value ?? '')
    })

  indexLoadPromise = load

  return load
}

const bindUi = () => {
  const root = document.querySelector('[data-site-search]')

  if (!root || root.getAttribute('data-site-search-bound') === 'true') return

  const trigger = root.querySelector('[data-site-search-trigger]')
  const closeBtn = root.querySelector('[data-site-search-close]')
  const inputClearBtn = root.querySelector('[data-site-search-input-clear]')
  const input = getInput()
  const results = getResults()
  const dialog = getDialog()
  const scrim = dialog?.querySelector('[data-site-search-scrim]')

  if (!(trigger instanceof HTMLButtonElement) || !(closeBtn instanceof HTMLButtonElement) ||
    !(input instanceof HTMLInputElement) || !(results instanceof HTMLElement) ||
    !(dialog instanceof HTMLDialogElement)) {
    return
  }

  root.setAttribute('data-site-search-bound', 'true')

  trigger.addEventListener('click', () => {
    if (dialog.open) {
      closeSearch({ focusTrigger: true })

      return
    }

    openSearch()

    void loadIndex()
  })

  closeBtn.addEventListener('click', () => {
    closeSearch({ focusTrigger: true })
  })

  if (inputClearBtn instanceof HTMLButtonElement) {
    inputClearBtn.addEventListener('click', () => {
      input.value = ''

      input.dispatchEvent(new Event('input', { bubbles: true }))

      input.focus()
    })
  }

  if (scrim instanceof HTMLElement) {
    scrim.addEventListener('click', () => {
      closeSearch({ focusTrigger: true })
    })
  }

  dialog.addEventListener('close', () => {
    // History traversal changes the URL before the old DOM is disconnected.
    // A delayed close must not clear the destination query or its UI state.
    if (dialog.open || !dialog.isConnected || window.location.href !== searchURL) return

    cancelPendingClose()

    setScrollLock(false)

    setTriggerExpanded(false)

    syncQueryInURL('')
  })

  dialog.addEventListener('cancel', e => {
    e.preventDefault()

    closeSearch({ focusTrigger: true })
  })

  dialog.addEventListener('keydown', e => {
    if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return

    if (isComposingKey(e)) return

    // The native dialog may tab into browser chrome when the loading state
    // leaves the input last. Keep both ends inside as results come and go.
    if (e.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')]
        .filter(element => element instanceof HTMLElement && element.getClientRects().length > 0 &&
          element.tabIndex >= 0 && getComputedStyle(element).visibility === 'visible')

      const first = focusable.at(0)
      const last = focusable.at(-1)
      const boundary = e.shiftKey ? first : last
      const destination = e.shiftKey ? last : first

      if (document.activeElement === boundary && destination instanceof HTMLElement) {
        e.preventDefault()

        destination.focus()
      }

      return
    }

    if (e.key === 'Escape') {
      // Override the native search-input clear action and keep the underlying menu open.
      e.preventDefault()

      e.stopPropagation()

      closeSearch({ focusTrigger: true })

      return
    }

    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

    const links = [...results.querySelectorAll('a[href]')]
    const focusedIndex = e.target instanceof Element ? links.indexOf(e.target) : -1

    // Other dialog controls keep their native arrow keys.
    if (links.length === 0 || (e.target !== input && focusedIndex < 0)) return

    e.preventDefault()

    // Step from the focused result, even when the pointer moved the highlight.
    if (focusedIndex >= 0) selectedResultIndex = focusedIndex

    if (e.key === 'ArrowDown') {
      if (selectedResultIndex < 0) {
        selectedResultIndex = 0
      } else {
        selectedResultIndex = (selectedResultIndex + 1) % links.length
      }
    } else if (selectedResultIndex < 0) {
      selectedResultIndex = links.length - 1
    } else {
      selectedResultIndex = (selectedResultIndex - 1 + links.length) % links.length
    }

    syncResultSelection()

    const link = links[selectedResultIndex]

    // Move focus with the highlight so native Enter opens it. Screen readers
    // announce the newly focused link, so the status is left unchanged.
    if (focusedIndex >= 0 && link instanceof HTMLElement) {
      link.focus({ preventScroll: true })

      return
    }

    const description = describeResultAt(selectedResultIndex, links.length)

    if (description) setStatusMessage(description)
  })

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.altKey || isComposingKey(e)) return

    const links = [...results.querySelectorAll('a[href]')]

    if (selectedResultIndex < 0 || selectedResultIndex >= links.length) return

    e.preventDefault()

    rememberRecentSearch(input.value)

    const link = links[selectedResultIndex]

    if (!(link instanceof HTMLAnchorElement)) return

    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      // WebKit does not honor modifier keys on synthetic link clicks.
      window.open(link.href, '_blank', 'noopener,noreferrer')

      return
    }

    link.click()
  })

  input.addEventListener('input', () => {
    const value = input.value

    selectedResultIndex = 0

    render(value)

    syncQueryInURL(value)
  })

  results.addEventListener('click', event => {
    const retryButton =
      event.target instanceof Element ? event.target.closest('[data-site-search-retry]') : null

    if (retryButton instanceof HTMLButtonElement) {
      event.preventDefault()

      input.focus()

      void loadIndex({ force: true })

      return
    }

    const suggestion =
      event.target instanceof Element ?
        event.target.closest('[data-site-search-suggestion]') :
        null

    if (suggestion instanceof HTMLButtonElement) {
      event.preventDefault()

      const term = suggestion.dataset.siteSearchSuggestion ?? ''

      if (term) {
        input.value = term

        input.dispatchEvent(new Event('input', { bubbles: true }))

        input.focus()
      }

      return
    }

    const clearButton =
      event.target instanceof Element ?
        event.target.closest('[data-site-search-clear]') :
        null

    if (clearButton instanceof HTMLButtonElement) {
      event.preventDefault()

      input.value = ''

      input.dispatchEvent(new Event('input', { bubbles: true }))

      input.focus()

      return
    }

    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null

    if (!anchor) return

    if (event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    rememberRecentSearch(input.value)

    closeSearch()
  })

  const highlightResult = (event: Event) => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null

    if (!anchor) return

    const links = [...results.querySelectorAll('a[href]')]
    const next = links.indexOf(anchor)

    if (next < 0 || next === selectedResultIndex) return

    selectedResultIndex = next

    syncResultSelection()
  }

  results.addEventListener('mousemove', highlightResult)

  // Tabbing onto a result highlights it, so the highlight matches native Enter.
  results.addEventListener('focusin', highlightResult)

  // Defer the search-index fetch until the user actually opens the modal
  // (trigger click, Cmd/Ctrl+K, or '/'), or arrives with a `?q=` deep-link.
  // This avoids a network + parse cost on every page navigation.
  const params = new URLSearchParams(window.location.search)
  const queryFromURL = params.get('q')

  if (queryFromURL && isSearchableQuery(queryFromURL)) {
    selectedResultIndex = 0

    input.value = queryFromURL

    openSearch()

    // Completion renders the current input, which may have changed while loading.
    void loadIndex()
  }
}

const onGlobalKeydown = (event: KeyboardEvent) => {
  if (isComposingKey(event)) return

  const dialog = getDialog()
  const isOpen = dialog instanceof HTMLDialogElement && dialog.open
  const isClosing = isOpen && dialog.getAttribute('data-site-search-anim') === 'closing'

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    if (!isOpen && isEditableTarget(event.target)) return

    event.preventDefault()

    if (!isOpen || isClosing) {
      openSearch()
    }

    void loadIndex()

    return
  }

  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    if (isOpen && !isClosing) return

    const isSearchTarget = event.target instanceof Node && dialog?.contains(event.target)

    if (isEditableTarget(event.target) && !(isClosing && isSearchTarget)) return

    event.preventDefault()

    openSearch()

    void loadIndex()
  }
}

// Astro bundles this module once; the controller and index survive page swaps.
document.addEventListener('keydown', onGlobalKeydown)

bindUi()

document.addEventListener('astro:before-swap', () => {
  cancelPendingClose()

  setScrollLock(false)
})

document.addEventListener('astro:after-swap', bindUi)
