import type { CollectionEntry } from 'astro:content'

type DestinationData = Pick<CollectionEntry<'project'>['data'], 'title' | 'liveDemoName' | 'liveDemoUrl' | 'githubUrl'>

export const getProjectPrimaryDestination = ({ title, liveDemoName, liveDemoUrl, githubUrl }: DestinationData) => {
  const href = liveDemoUrl ?? githubUrl

  if (!href) return undefined

  const name = liveDemoName ?? title

  if (!liveDemoUrl) return { href, name, context: 'Explore the source', action: 'Open repository' }

  if (new URL(href).hostname === 'web.archive.org') {
    return { href, name, context: 'Explore the archived website', action: `View ${name} archive` }
  }

  return { href, name, context: 'Explore the website', action: `Visit ${name}` }
}
