import type { CollectionEntry } from 'astro:content'

import { siteConfig } from '@/site.config'

export const getFormattedDate = (
  input: Date | string | number | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  // 1 → Valida que haya dato
  if (input === undefined) return 'Invalid Date'

  // 2 → Garantiza un Date
  const date = input instanceof Date ? input : new Date(input)

  // 3 → Comprueba que el Date sea válido
  if (Number.isNaN(date.getTime())) return 'Invalid Date'

  // 4 → Formatea
  return new Intl.DateTimeFormat(
    siteConfig.date.locale, { ...(siteConfig.date.options as Intl.DateTimeFormatOptions), ...options }
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
