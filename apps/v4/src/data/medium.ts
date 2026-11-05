import type { MediumPost } from '../types/medium'

import { mediumPostsCache } from './medium-cache'

// Historical feed content is deliberately independent of the live feed.
export const getMediumPosts = (): Promise<MediumPost[]> => Promise.resolve(mediumPostsCache)
export const getMediumPostBySlug = (
  slug: string
): Promise<MediumPost | undefined> => Promise.resolve(mediumPostsCache.find(post => post.slug === slug))
