import type { SearchIndexEntry } from '@/types/search'

import { getLocale, localizePath } from '@/i18n'

import { t } from './copy'
import { getResultLinks, prefersReducedMotion, setStatusMessage } from './dom'

/** DOM rendering for the search results list. The controller owns state; these only draw it. */

/** Marks the selected result and keeps it in view; `-1` clears the selection. */
export const syncResultSelection = (results: HTMLElement, selectedIndex: number) => {
  getResultLinks(results).forEach((a, i) => {
    if (i === selectedIndex) {
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

/**
 * Announces the highlighted result while keyboard focus remains in the input.
 */
export const describeResultAt = (results: HTMLElement, index: number, total: number): string => {
  const title = getResultLinks(results)[index]?.querySelector('[data-site-search-result-title]')?.textContent.trim()

  if (!title) return ''

  return t('shared.titlePositionOfTotal', { title, position: index + 1, total })
}

export const renderRecoveryCard = (results: HTMLElement, kind: 'empty' | 'idle' | 'error') => {
  const template = document.querySelector(`[data-site-search-${kind}-template]`)

  if (template instanceof HTMLTemplateElement) results.replaceChildren(template.content.cloneNode(true))
}

/**
 * Renders the empty state shown before the user starts typing. Prefers a
 * "Recent searches" list when localStorage has prior queries, otherwise
 * falls back to "Popular topics" derived from the loaded index.
 */
export const renderEmptyState = (
  results: HTMLElement,
  { popularTopics, recentSearches }: { popularTopics: readonly string[], recentSearches: readonly string[] }
) => {
  const hasRecentSearches = recentSearches.length > 0
  const items = hasRecentSearches ? recentSearches : popularTopics

  if (items.length === 0) {
    renderRecoveryCard(results, 'idle')

    setStatusMessage(t('shared.typeAtLeastTwoCharactersTo'))

    return
  }

  const heading = t(hasRecentSearches ? 'shared.recentSearches' : 'shared.popularTopics')
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

  setStatusMessage(t('shared.countHeadingAvailable', { count: items.length, heading: heading.toLowerCase() }))
}

export const appendResult = (results: HTMLElement, e: SearchIndexEntry, description = e.description) => {
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

  let resultTypeLabel = t('shared.project')

  if (e.type === 'post') {
    resultTypeLabel = t('shared.post')
  } else if (e.type === 'community') {
    resultTypeLabel = t('shared.community')
  } else if (e.type === 'page') {
    resultTypeLabel = t('shared.page')
  }

  typeEl.textContent = resultTypeLabel

  const titleEl = document.createElement('span')

  titleEl.setAttribute('data-site-search-result-title', '')

  titleEl.textContent = e.title

  titleEl.lang = getLocale(e.path)

  const descEl = document.createElement('span')

  descEl.setAttribute('data-site-search-result-description', '')

  descEl.textContent = description

  descEl.lang = getLocale(e.path)

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

export const renderLoadingState = (results: HTMLElement, message: string) => {
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
