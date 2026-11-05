import type { CollectionEntry } from 'astro:content'

/** Valid remark admonition directive names (:::note, :::tip, etc.). */
export type AdmonitionType = 'tip' | 'note' | 'important' | 'caution' | 'warning'

/** Shared screenshot contract for project galleries and before/after comparisons. */
export type ProjectPreviewImage = NonNullable<CollectionEntry<'project'>['data']['previews']>['images'][number]
