/* eslint-disable func-style */
import { type CollectionEntry, getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export async function getAllTypes(): Promise<CollectionEntry<'types'>[]> {
  return await getCollection('types')
}
