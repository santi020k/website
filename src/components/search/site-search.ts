import type { SearchIndexEntry } from '@/types/search'
import { createFullTextSearch } from '@/utils/full-text-search'
import { isSearchableQuery, rankSearchEntries, stepResultIndex } from '@/utils/search'

import { getLocale } from '@/i18n'

import { t } from './copy'
import {
  getDialog,
  getFocusWrap,
  getInput,
  getPanel,
  getResultLinks,
  getResults,
  getTrigger,
  isComposingKey,
  isEditableTarget,
  prefersReducedMotion,
  setScrollLock,
  setStatusMessage,
  setTriggerExpanded
} from './dom'
import { createIndexLoader } from './index-loader'
import { getRecentSearches, rememberRecentSearch } from './recent-searches'
import {
  appendResult,
  describeResultAt,
  renderEmptyState,
  renderLoadingState,
  renderRecoveryCard,
  syncResultSelection
} from './results-view'

/**
 * Search dialog controller: open/close, URL sync, keyboard handling and result
 * rendering. Index loading, storage and DOM drawing live in the sibling modules.
 */

const fullTextSearch = createFullTextSearch()
let renderRevision = 0
let navigatedSinceRender = false
let selectedResultIndex = -1
let searchURL = window.location.href
let closeAnimTimer = 0
let closeAnimPanel: HTMLElement | null = null
let closeAnimHandler: ((event: AnimationEvent) => void) | null = null

const syncSelection = () => {
  const results = getResults()

  if (results) syncResultSelection(results, selectedResultIndex)
}

const index = createIndexLoader()

const appendBodyMatches = async (query: string, shown: SearchIndexEntry[], results: HTMLElement, revision: number) => {
  if (shown.length >= 8 || !getDialog()?.open) return

  results.dataset.siteSearchState = 'pending'

  if (shown.length === 0) {
    renderLoadingState(results, t('shared.searchingArticleText'))

    setStatusMessage(t('shared.searchingArticleText7'))
  }

  const outcome = await fullTextSearch(
    query,
    index.entries,
    new Set(shown.map(entry => entry.path)),
    window.location.origin,
    getLocale(window.location.pathname)
  )

  if (revision !== renderRevision || results !== getResults() || !getDialog()?.open) return

  results.dataset.siteSearchState = 'settled'

  results.toggleAttribute('data-site-search-content-unavailable', outcome.unavailable)

  const hits = outcome.hits.slice(0, 8 - shown.length)

  if (shown.length === 0 && hits.length === 0 && !outcome.unavailable) {
    renderRecoveryCard(results, 'empty')

    setStatusMessage(t('shared.noMatchingResultsForQueryTry', { query }))
  }

  if (hits.length > 0) {
    if (shown.length === 0) results.replaceChildren()

    const group = document.createElement('li')
    const heading = document.createElement('div')

    group.setAttribute('data-site-search-full-text', '')

    heading.setAttribute('data-site-search-group-title', '')

    heading.textContent = t('shared.mentionedIn')

    group.append(heading)

    results.append(group)

    for (const hit of hits) appendResult(results, hit.entry, hit.excerpt)

    if (selectedResultIndex < 0) selectedResultIndex = 0

    syncSelection()

    if (!navigatedSinceRender) {
      const count = shown.length + hits.length

      setStatusMessage(t(count === 1 ?
        'shared.countResultAvailableUseArrowKeys' :
        'shared.countResultsAvailableUseArrowKeys', { count }))
    }
  }

  if (outcome.unavailable && shown.length === 0 && hits.length === 0) {
    const note = document.createElement('li')

    note.className = 'site-search-hint px-4 py-8 text-center text-sm text-ink-soft'

    note.textContent = t('shared.contentSearchIsTemporarilyUnavailableShowing')

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

  if (index.state === 'loading') {
    selectedResultIndex = -1

    renderLoadingState(results, t('shared.loadingSearchIndex'))

    setStatusMessage(t('shared.loadingSearchIndex7'))

    return
  }

  if (index.state === 'error') {
    selectedResultIndex = -1

    renderRecoveryCard(results, 'error')

    setStatusMessage(t('shared.searchIsTemporarilyUnavailable'))

    return
  }

  if (!isSearchableQuery(trimmed)) {
    selectedResultIndex = -1

    renderEmptyState(results, { popularTopics: index.popularTopics, recentSearches: getRecentSearches() })

    return
  }

  const matches = rankSearchEntries(index.entries, trimmed)

  if (matches.length === 0) {
    selectedResultIndex = -1

    renderRecoveryCard(results, 'empty')

    setStatusMessage(t('shared.noMatchingResultsForQueryTry', { query: trimmed }))

    void appendBodyMatches(trimmed, [], results, renderRevision)

    return
  }

  selectedResultIndex = Math.min(Math.max(selectedResultIndex, 0), matches.length - 1)

  for (const match of matches) appendResult(results, match)

  syncSelection()

  setStatusMessage(
    t(matches.length === 1 ?
      'shared.countResultAvailableUseArrowKeys' :
      'shared.countResultsAvailableUseArrowKeys', { count: matches.length })
  )

  void appendBodyMatches(trimmed, matches, results, renderRevision)
}

index.onChange(() => {
  render(getInput()?.value ?? '')
})

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

    void index.load()
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

    if (e.key === 'Tab') {
      const { boundary, destination } = getFocusWrap(dialog, e.shiftKey)

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

    const links = getResultLinks(results)
    const focusedIndex = e.target instanceof Element ? links.indexOf(e.target) : -1

    // Other dialog controls keep their native arrow keys.
    if (links.length === 0 || (e.target !== input && focusedIndex < 0)) return

    e.preventDefault()

    navigatedSinceRender = true

    // Step from the focused result, even when the pointer moved the highlight.
    if (focusedIndex >= 0) selectedResultIndex = focusedIndex

    selectedResultIndex = stepResultIndex(selectedResultIndex, links.length, e.key === 'ArrowDown' ? 1 : -1)

    syncSelection()

    const link = links[selectedResultIndex]

    // Move focus with the highlight so native Enter opens it. Screen readers
    // announce the newly focused link, so the status is left unchanged.
    if (focusedIndex >= 0 && link instanceof HTMLElement) {
      link.focus({ preventScroll: true })

      return
    }

    const description = describeResultAt(results, selectedResultIndex, links.length)

    if (description) setStatusMessage(description)
  })

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.altKey || isComposingKey(e)) return

    const links = getResultLinks(results)

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

      void index.load({ force: true })

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

    const links = getResultLinks(results)
    const next = links.indexOf(anchor)

    if (next < 0 || next === selectedResultIndex) return

    selectedResultIndex = next

    navigatedSinceRender = true

    syncSelection()
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
    void index.load()
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

  void index.load()
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
