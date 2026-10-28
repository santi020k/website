import type { SearchIndexEntry } from '@/types/search'
import { createFullTextSearch } from '@/utils/full-text-search'
import {
  getPopularTopics,
  isSearchableQuery,
  isSearchEntry,
  normalizeRecentSearches,
  rankSearchEntry
} from '@/utils/search'

import { getLocale, localizePath, translate } from '@/i18n'

const t = (text: string, values: Readonly<Record<string, number | string>> = {}) => (
  translate(getLocale(window.location.pathname), text, values)
)

const fullTextSearch = createFullTextSearch()
let renderRevision = 0
let navigatedSinceRender = false
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

// Reads validate in memory only; storage is rewritten when a search is remembered.
const getRecentSearches = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)

    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    return normalizeRecentSearches(parsed)
  } catch {
    return []
  }
}

const rememberRecentSearch = (query: string) => {
  const trimmed = query.trim()

  if (!isSearchableQuery(trimmed)) return

  try {
    const next = normalizeRecentSearches([trimmed, ...getRecentSearches()])

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

  return t('{title}, {position} of {total}', { title, position: index + 1, total })
}

const renderRecoveryCard = (results: HTMLElement, kind: 'empty' | 'idle' | 'error') => {
  const template = document.querySelector(`[data-site-search-${kind}-template]`)

  if (template instanceof HTMLTemplateElement) results.replaceChildren(template.content.cloneNode(true))
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
    renderRecoveryCard(results, 'idle')

    setStatusMessage(t('Type at least two characters to search.'))

    return
  }

  const heading = t(hasRecentSearches ? 'Recent searches' : 'Popular topics')
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

  setStatusMessage(t('{count} {heading} available.', { count: items.length, heading: heading.toLowerCase() }))
}

const appendResult = (results: HTMLElement, e: SearchIndexEntry, description = e.description) => {
  const arrowTemplate = document.querySelector('[data-site-search-result-arrow-template]')
  const li = document.createElement('li')
  const a = document.createElement('a')

  a.href = localizePath(e.path, getLocale(window.location.pathname))

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

  body.setAttribute('data-site-search-result-body', '')

  const typeEl = document.createElement('span')

  typeEl.setAttribute('data-site-search-result-type', '')

  let resultTypeLabel = 'Project'

  if (e.type === 'post') {
    resultTypeLabel = 'Post'
  } else if (e.type === 'community') {
    resultTypeLabel = 'Community'
  }

  typeEl.textContent = t(resultTypeLabel)

  const titleEl = document.createElement('span')

  titleEl.setAttribute('data-site-search-result-title', '')

  titleEl.textContent = e.title

  titleEl.lang = 'en'

  const descEl = document.createElement('span')

  descEl.setAttribute('data-site-search-result-description', '')

  descEl.textContent = description

  descEl.lang = 'en'

  body.append(typeEl, titleEl, descEl)

  a.append(thumbHost, body)

  if (arrowTemplate instanceof HTMLTemplateElement) {
    const arrow = document.createElement('span')

    arrow.setAttribute('data-site-search-result-arrow', '')

    arrow.setAttribute('aria-hidden', 'true')

    arrow.append(arrowTemplate.content.cloneNode(true))

    a.append(arrow)
  }

  li.appendChild(a)

  results.appendChild(li)
}

const renderLoadingState = (results: HTMLElement, message: string) => {
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
        <span class="text-sm text-ink-soft" data-site-search-loading-label></span>
      </li>
    `

  const label = results.querySelector('[data-site-search-loading-label]')

  if (label) label.textContent = message
}

const appendBodyMatches = async (query: string, shown: SearchIndexEntry[], results: HTMLElement, revision: number) => {
  if (shown.length >= 8 || !getDialog()?.open) return

  results.dataset.siteSearchState = 'pending'

  if (shown.length === 0) {
    renderLoadingState(results, t('Searching article text…'))

    setStatusMessage(t('Searching article text.'))
  }

  const outcome = await fullTextSearch(query, entries, new Set(shown.map(entry => entry.path)), window.location.origin)

  if (revision !== renderRevision || results !== getResults() || !getDialog()?.open) return

  results.dataset.siteSearchState = 'settled'

  results.toggleAttribute('data-site-search-content-unavailable', outcome.unavailable)

  const hits = outcome.hits.slice(0, 8 - shown.length)

  if (shown.length === 0 && hits.length === 0 && !outcome.unavailable) {
    renderRecoveryCard(results, 'empty')

    setStatusMessage(t('No matching results for {query}. Try different keywords.', { query }))
  }

  if (hits.length > 0) {
    if (shown.length === 0) results.replaceChildren()

    const group = document.createElement('li')
    const heading = document.createElement('div')

    group.setAttribute('data-site-search-full-text', '')

    heading.setAttribute('data-site-search-group-title', '')

    heading.textContent = t('Mentioned in')

    group.append(heading)

    results.append(group)

    for (const hit of hits) appendResult(results, hit.entry, hit.excerpt)

    if (selectedResultIndex < 0) selectedResultIndex = 0

    syncResultSelection()

    if (!navigatedSinceRender) {
      const count = shown.length + hits.length

      setStatusMessage(t(count === 1 ?
        '{count} result available. Use arrow keys to navigate.' :
        '{count} results available. Use arrow keys to navigate.', { count }))
    }
  }

  if (outcome.unavailable && shown.length === 0 && hits.length === 0) {
    const note = document.createElement('li')

    note.className = 'site-search-hint px-4 py-8 text-center text-sm text-ink-soft'

    note.textContent = t('Content search is temporarily unavailable. Showing title and tag matches.')

    results.replaceChildren(note)

    if (!navigatedSinceRender) setStatusMessage(note.textContent)
  }
}

const render = (query: string) => {
  const results = getResults()

  if (!results) return

  renderRevision += 1

  navigatedSinceRender = false

  results.dataset.siteSearchState = 'settled'

  results.innerHTML = ''

  const trimmed = query.trim()

  if (indexLoadState === 'loading') {
    selectedResultIndex = -1

    renderLoadingState(results, t('Loading search index…'))

    setStatusMessage(t('Loading search index.'))

    return
  }

  if (indexLoadState === 'error') {
    selectedResultIndex = -1

    renderRecoveryCard(results, 'error')

    setStatusMessage(t('Search is temporarily unavailable.'))

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

    renderRecoveryCard(results, 'empty')

    setStatusMessage(t('No matching results for {query}. Try different keywords.', { query: trimmed }))

    void appendBodyMatches(trimmed, [], results, renderRevision)

    return
  }

  selectedResultIndex = Math.min(Math.max(selectedResultIndex, 0), matches.length - 1)

  for (const match of matches) appendResult(results, match.entry)

  syncResultSelection()

  setStatusMessage(
    t(matches.length === 1 ?
      '{count} result available. Use arrow keys to navigate.' :
      '{count} results available. Use arrow keys to navigate.', { count: matches.length })
  )

  void appendBodyMatches(trimmed, matches.map(match => match.entry), results, renderRevision)
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
  } else if (url.searchParams.has('q')) {
    // Any searchParams write re-encodes the whole query, so skip it when `q` is absent.
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
  renderRevision += 1

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

    // History traversal during the animation can make the native close handler
    // skip cleanup. Swaps cancel this callback, so it only runs on this document.
    if (dialog.isConnected) setTriggerExpanded(false)

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

    navigatedSinceRender = true

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

    navigatedSinceRender = true

    syncResultSelection()
  }

  results.addEventListener('mousemove', highlightResult)

  // Tabbing onto a result highlights it, so the highlight matches native Enter.
  results.addEventListener('focusin', highlightResult)

  // Defer the search-index fetch until the user actually opens the modal
  // (trigger click or Cmd/Ctrl+K), or arrives with a `?q=` deep-link.
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

  // Bare printable keys stay with the page, assistive tech, and browser find.
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return

  // A closing dialog may reopen from its own input.
  if (!isOpen && isEditableTarget(event.target)) return

  event.preventDefault()

  if (!isOpen || isClosing) {
    openSearch()
  }

  void loadIndex()
}

/**
 * Same-document traversal, such as Back from a skip-link fragment, never
 * reaches Astro's swap lifecycle, so an open dialog must follow the URL here.
 * Path and other query changes stay with Astro and the close guard.
 */
const onPopState = () => {
  const dialog = getDialog()

  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return

  // An in-flight close already owns cleanup.
  if (dialog.getAttribute('data-site-search-anim') === 'closing') return

  const source = new URL(searchURL)
  const destination = new URL(window.location.href)
  const sourceParams = new URLSearchParams(source.search)
  const destinationParams = new URLSearchParams(destination.search)

  // Astro never sees the `q` this controller writes with replaceState, and
  // writing it may have re-encoded the other parameters, so compare without it.
  sourceParams.delete('q')

  destinationParams.delete('q')

  const onlyFragmentChanged = destination.origin === source.origin &&
    destination.pathname === source.pathname &&
    destinationParams.toString() === sourceParams.toString() &&
    destination.hash !== source.hash

  // Closing clears `q`, so a searchable deep link keeps the dialog open.
  if (!onlyFragmentChanged || isSearchableQuery(destination.searchParams.get('q') ?? '')) return

  closeSearch({ focusTrigger: true })
}

// Astro bundles this module once; the controller and index survive page swaps.
document.addEventListener('keydown', onGlobalKeydown)

window.addEventListener('popstate', onPopState)

bindUi()

document.addEventListener('astro:before-swap', () => {
  renderRevision += 1

  cancelPendingClose()

  setScrollLock(false)
})

document.addEventListener('astro:after-swap', bindUi)
