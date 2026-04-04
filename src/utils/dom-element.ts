/**
 * Toggle a CSS class on a DOM element without leaking classList usage into
 * callers that just need a small state helper.
 */
export const toggleClass = (element: HTMLElement, className: string) => {
  element.classList.toggle(className)
}

/** Check whether an element already carries a CSS class. */
export const elementHasClass = (element: HTMLElement, className: string) => element.classList.contains(className)

/** Read the active theme directly from the root element. */
export const rootInDarkMode = () => document.documentElement.getAttribute('data-theme') === 'dark'
