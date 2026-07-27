/**
 * Toggles a CSS class on a DOM element.
 * Encapsulates `classList.toggle` so callers don't need direct classList access.
 */
export const toggleClass = (element: HTMLElement, className: string): void => {
  element.classList.toggle(className)
}

/** Returns `true` when the element currently has the given CSS class applied. */
export const elementHasClass = (element: HTMLElement, className: string): boolean => (
  element.classList.contains(className)
)

/**
 * Returns `true` when the site is currently displayed in dark mode.
 * Reads the `data-theme` attribute set by ThemeProvider on `<html>`.
 */
export const rootInDarkMode = (): boolean => document.documentElement.getAttribute('data-theme') === 'dark'
