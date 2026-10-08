import { type CollectionEntry, getCollection } from 'astro:content'

/** filter out draft posts based on the environment */
export const getAllPosts = async (): Promise<CollectionEntry<'post'>[]> => await getCollection('post', ({ data }) => !data.draft)

/** groups posts by year (based on option siteConfig.sortPostsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export const groupPostsByYear = (posts: CollectionEntry<'post'>[]) => posts.reduce<Record<string, CollectionEntry<'post'>[] | undefined>>((acc, post) => {
  const year = post.data.publishDate.getFullYear()

  acc[year] ??= []

  acc[year].push(post)

  return acc
}, {})

/** returns all tags created from posts (inc duplicate tags)
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export const getAllTags = (posts: CollectionEntry<'post'>[]) => posts.flatMap(post => [...post.data.tags])

/** returns all unique tags created from posts
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export const getUniqueTags = (posts: CollectionEntry<'post'>[]) => [...new Set(getAllTags(posts))]

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export const getUniqueTagsWithCount = (posts: CollectionEntry<'post'>[]): [string, number][] => [
  ...getAllTags(posts).reduce(
    (acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1), new Map<string, number>()
  )
].sort((a, b) => b[1] - a[1])
