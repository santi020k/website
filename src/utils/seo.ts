const SHORT_BRAND_SUFFIX = ' | santi020k'
const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

/** Prevent content strings from closing the JSON-LD script element. */
export const serializeStructuredData = (value: Record<string, unknown> | Record<string, unknown>[]) => JSON.stringify(value).replaceAll('<', '\\u003c')

const removeTrailingBrand = (title: string) => {
  const withoutShortBrand = title.replace(/\s*\|\s*santi020k$/i, '')

  return withoutShortBrand
    .replace(/\s+(?:—|-)\s+Santiago Molina$/i, '')
    .trim()
}

/**
 * Creates a consistently branded document title without changing the
 * visible page heading or the Open Graph title.
 */
export const createSeoTitle = (title: string, siteTitle: string) => {
  const normalizedTitle = normalizeWhitespace(title)

  if (normalizedTitle === siteTitle) return normalizedTitle

  const unbrandedTitle = removeTrailingBrand(normalizedTitle)

  return `${unbrandedTitle}${SHORT_BRAND_SUFFIX}`
}

/** Preserve authored descriptions; snippet length is an editorial choice. */
export const createSeoDescription = (description: string) => normalizeWhitespace(description)
