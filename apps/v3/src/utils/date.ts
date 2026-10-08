import type { CollectionEntry } from 'astro:content'

import { siteConfig } from '../site.config'

/** Format dates with the site's default locale and presentation options. */
export const getFormattedDate = (
  input: Date | string | number | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (input === undefined) return 'Invalid Date'

  const date = input instanceof Date ? input : new Date(input)

  if (Number.isNaN(date.getTime())) return 'Invalid Date'

  // Merge options, excluding undefined values to allow removing defaults (e.g., day: undefined)
  // Content dates are authored as UTC calendar dates. Formatting them in the
  // runtime's local timezone can shift midnight values to the previous day.
  const mergedOptions = { timeZone: 'UTC', ...(siteConfig.date.options), ...options }

  const cleanedOptions = Object.fromEntries(
    Object.entries(mergedOptions).filter(([, v]) => v !== undefined)
  ) as Intl.DateTimeFormatOptions

  return new Intl.DateTimeFormat(siteConfig.date.locale, cleanedOptions).format(date)
}

/** Sort projects from newest to oldest using their starting date. */
export const collectionDateSortProjects = (
  a: CollectionEntry<'project'>,
  b: CollectionEntry<'project'>
) => b.data.startingDate.getTime() - a.data.startingDate.getTime()

/** Sort projects by portfolio relevance, using recency as a stable tie-breaker. */
export const collectionRelevanceSortProjects = (
  a: CollectionEntry<'project'>,
  b: CollectionEntry<'project'>
) => b.data.relevanceWeight - a.data.relevanceWeight || collectionDateSortProjects(a, b)
