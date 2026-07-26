const MAX_META_DESCRIPTION_LENGTH = 160
const MAX_META_TITLE_LENGTH = 60
const MIN_META_DESCRIPTION_LENGTH = 120
const SHORT_BRAND_SUFFIX = ' | santi020k'

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const truncateAtWord = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value

  const availableLength = maxLength - 1
  const candidate = value.slice(0, availableLength + 1)
  const lastSpace = candidate.lastIndexOf(' ')
  const cutAt = lastSpace >= Math.floor(availableLength * 0.65) ? lastSpace : availableLength

  return `${candidate.slice(0, cutAt).trimEnd()}…`
}

const removeTrailingBrand = (title: string) => title
  .replace(/\s+(?:—|-)\s+Santiago Molina(?:\s*\|\s*santi020k)?$/i, '')
  .replace(/\s*\|\s*santi020k$/i, '')
  .trim()

/**
 * Creates a concise, consistently branded document title without changing the
 * visible page heading or the Open Graph title.
 */
export const createSeoTitle = (title: string, siteTitle: string) => {
  const normalizedTitle = normalizeWhitespace(title)

  if (normalizedTitle === siteTitle) return normalizedTitle

  const unbrandedTitle = removeTrailingBrand(normalizedTitle)
  const availableTitleLength = MAX_META_TITLE_LENGTH - SHORT_BRAND_SUFFIX.length
  const conciseTitle = truncateAtWord(unbrandedTitle, availableTitleLength)

  return `${conciseTitle}${SHORT_BRAND_SUFFIX}`
}

/**
 * Keeps descriptions within a useful snippet range. Short source descriptions
 * gain page-specific context so archives do not reuse identical metadata.
 */
export const createSeoDescription = (description: string, title: string) => {
  const normalizedDescription = normalizeWhitespace(description)

  if (normalizedDescription.length >= MIN_META_DESCRIPTION_LENGTH) {
    return truncateAtWord(normalizedDescription, MAX_META_DESCRIPTION_LENGTH)
  }

  const conciseTitle = removeTrailingBrand(normalizeWhitespace(title))
  const expandedDescription = [
    normalizedDescription,
    `Explore ${conciseTitle} through practical context, technical decisions, and lessons from Santiago Molina’s real-world work.`
  ].join(' ')

  return truncateAtWord(expandedDescription, MAX_META_DESCRIPTION_LENGTH)
}
