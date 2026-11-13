import { type CollectionEntry, getCollection } from 'astro:content'

import type { Locale } from '@/i18n'
import { localizePageSource } from '@/i18n/page-copy'

type TalkData = CollectionEntry<'talk'>['data']

/** Talk copy is localized through the page catalog; names and places fall through unchanged. */
export const localizeTalk = (locale: Locale, data: TalkData): TalkData => ({
  ...data,
  title: localizePageSource(locale, data.title),
  description: localizePageSource(locale, data.description),
  audience: data.audience ? localizePageSource(locale, data.audience) : undefined,
  location: data.location ? localizePageSource(locale, data.location) : undefined,
  tags: data.tags.map(tag => localizePageSource(locale, tag))
})

/** Newest first. Talks known only by year sort at that year's end; `order` breaks ties. */
export const sortTalks = <T extends Pick<TalkData, 'date' | 'order' | 'year'>>(talks: readonly T[]): T[] => [...talks].sort((a, b) => {
  const aSortDate = a.date?.valueOf() ?? Date.UTC(a.year, 11, 31)
  const bSortDate = b.date?.valueOf() ?? Date.UTC(b.year, 11, 31)

  return (bSortDate - aSortDate) || (a.order - b.order)
})

export const getSpeakingTalks = async (locale: Locale) => sortTalks(
  (await getCollection('talk', ({ data }) => !data.draft)).map(({ data }) => localizeTalk(locale, data))
)

/** The published-writing highlight counts live posts instead of a fixed number. */
export const withPublishedPostCount = <T extends { label: string, value: string }>(
  highlights: readonly T[],
  publishedWritingLabel: string,
  postCount: number
): T[] => {
  const value = String(postCount)

  return highlights.map(highlight => highlight.label === publishedWritingLabel ? { ...highlight, value } : highlight)
}
