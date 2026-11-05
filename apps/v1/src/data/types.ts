import { type CollectionEntry, getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export const getAllTypes = async (): Promise<CollectionEntry<'types'>[]> => await getCollection('types')
