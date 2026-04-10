/**
 * Central re-export barrel for all shared TypeScript types.
 *
 * Import from '@/types' (resolves to this file via the index convention).
 * Domain-specific files can also be imported directly for smaller bundles:
 *   import type { SiteMeta } from '@/types/site'
 *   import type { MediumPost } from '@/types/medium'
 */
export type { AdmonitionType } from './content'
export type { MediumPost } from './medium'
export type {
  PaginationLink,
  PreloadAsset,
  SiteConfig,
  SiteLink,
  SiteMeta,
  SiteSocialLink
} from './site'
export type { Badge, BadgeVariant } from './ui'
export type {
  WebmentionAuthor,
  WebmentionContent,
  WebmentionRels,
  WebmentionsCache,
  WebmentionsChildren,
  WebmentionsFeed,
  WebmentionSummary } from './webmentions'
