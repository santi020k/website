/** Element lookups and small DOM helpers shared by the search controller and its views. */

export const getDialog = () => document.querySelector<HTMLDialogElement>('#site-search-dialog')
export const getInput = () => document.querySelector<HTMLInputElement>('#site-search-input')
export const getResults = () => document.querySelector<HTMLElement>('#site-search-results')
export const getStatus = () => document.querySelector('#site-search-status')
export const getTrigger = () => document.querySelector('[data-site-search-trigger]')
export const getPanel = () => document.querySelector('[data-site-search-panel]')

export const setScrollLock = (locked: boolean) => {
  document.documentElement.classList.toggle('site-search-open', locked)

  document.body.classList.toggle('site-search-open', locked)
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Keep the documented legacy IME sentinel at this compatibility boundary.
 * Composition can start after, or end before, its keydown event, leaving
 * isComposing false. Retire this fallback when browsers expose that state.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event#keydown_events_with_ime
 */
interface CompositionKeyEvent { isComposing: boolean, keyCode: number }

export const isComposingKey = (event: CompositionKeyEvent) => event.isComposing || event.keyCode === 229

export const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  if (target.isContentEditable) return true

  const tag = target.tagName

  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true

  return false
}

export const setTriggerExpanded = (open: boolean) => {
  const trigger = getTrigger()

  if (trigger instanceof HTMLButtonElement) {
    trigger.setAttribute('aria-expanded', String(open))
  }
}

export const setStatusMessage = (message: string) => {
  const status = getStatus()

  if (!(status instanceof HTMLElement)) return

  if (status.textContent === message) return

  status.textContent = message
}

export const getResultLinks = (results: ParentNode) => [...results.querySelectorAll('a[href]')]

/**
 * The native dialog may tab into browser chrome when the loading state leaves the
 * input last. Returns the visible focus boundary for this direction and where Tab
 * past it should land, so both ends stay inside as results come and go.
 */
export const getFocusWrap = (dialog: HTMLDialogElement, backwards: boolean) => {
  const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')]
    .filter(element => element instanceof HTMLElement && element.getClientRects().length > 0 &&
      element.tabIndex >= 0 && getComputedStyle(element).visibility === 'visible')

  const first = focusable.at(0)
  const last = focusable.at(-1)

  return { boundary: backwards ? first : last, destination: backwards ? last : first }
}
