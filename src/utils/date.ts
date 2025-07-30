import type { CollectionEntry } from 'astro:content'

import { siteConfig } from '@/site.config'

export const getFormattedDate = (
  input: Date | string | number | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (input === undefined) return 'Invalid Date'

  const date = input instanceof Date ? input : new Date(input)

  if (Number.isNaN(date.getTime())) return 'Invalid Date'

  return new Intl.DateTimeFormat(
    siteConfig.date.locale, { ...(siteConfig.date.options), ...options }
  ).format(date)
}

export const collectionDateSort = (
  a: CollectionEntry<'post' | 'note'>,
  b: CollectionEntry<'post' | 'note'>
) => b?.data?.publishDate?.getTime?.() - a?.data?.publishDate?.getTime?.()

export const collectionDateSortProjects = (
  a: CollectionEntry<'project'>,
  b: CollectionEntry<'project'>
) => b?.data?.startingDate?.getTime?.() - a?.data?.startingDate?.getTime?.()
