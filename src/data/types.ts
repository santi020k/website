/* eslint-disable func-style */
import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export async function getAllTypes(): Promise<CollectionEntry<'types'>[]> {
  return await getCollection('types')
}
