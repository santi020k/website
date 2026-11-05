/**
 * Topic and technology archives with fewer published entries than this stay reachable from
 * navigation but ask search engines not to index them: a one-entry archive repeats its only
 * entry. The pages, the sitemap, and the social-card route manifest all use this threshold.
 */
export const MIN_INDEXED_ARCHIVE_ENTRIES = 3

/** Whether an archive with this many published entries should be indexed. */
export const isIndexedArchive = (entryCount: number): boolean => entryCount >= MIN_INDEXED_ARCHIVE_ENTRIES
