import type { CollectionEntry } from 'astro:content'

import type { PrintReference } from '@/plugins/rehype-print-references'

type PublicationPost = Pick<CollectionEntry<'post'>['data'], 'title' | 'canonicalUrl' | 'originalPublication'>

/** Metadata links join the existing print ledger without renumbering prose references. */
export const getPublicationImprint = (post: PublicationPost, proseReferences: readonly PrintReference[]) => {
  const references = [...proseReferences]
  const { canonicalUrl, originalPublication } = post

  if (!originalPublication || !canonicalUrl) return { imprint: undefined, references }

  const referenceNumber = (href: string, label: string) => {
    const normalized = new URL(href).href
    const index = references.findIndex(reference => reference.href === normalized)

    return index >= 0 ? index + 1 : references.push({ href: normalized, label })
  }

  return {
    imprint: {
      ...originalPublication,
      originalUrl: canonicalUrl,
      publisherReference: referenceNumber(originalPublication.url, originalPublication.name),
      articleReference: referenceNumber(canonicalUrl, post.title)
    },
    references
  }
}
