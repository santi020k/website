import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export const getAllTypes = async (): Promise<CollectionEntry<'types'>[]> => await getCollection('types')
