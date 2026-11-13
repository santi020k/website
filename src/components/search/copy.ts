import { getLocale, sharedTranslator } from '@/i18n'

/** Follows the current page's locale, which can change across Astro page swaps. */
export const t = sharedTranslator(() => getLocale(window.location.pathname))
