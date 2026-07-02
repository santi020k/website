import type { CollectionEntry } from 'astro:content'

import { getCachedProjects } from '@/utils/content'
import { getPortfolioPath } from '@/utils/links'

export const getAllProjects = async (): Promise<CollectionEntry<'project'>[]> => {
  return getCachedProjects()
}

const groupBy = (
  projects: CollectionEntry<'project'>[],
  key: (p: CollectionEntry<'project'>) => string
): Record<string, CollectionEntry<'project'>[] | undefined> => {
  const map = new Map<string, CollectionEntry<'project'>[]>()

  for (const project of projects) {
    const k = key(project)
    const existing = map.get(k)

    if (existing) existing.push(project)
    else map.set(k, [project])
  }

  return Object.fromEntries(map)
}

/** Groups projects by starting year. */
export const groupProjectsByYear = (
  projects: CollectionEntry<'project'>[]
): Record<string, CollectionEntry<'project'>[] | undefined> => {
  return groupBy(projects, p => p.data.startingDate.getFullYear().toString())
}

/** Groups projects by typesId. */
export const groupProjectsByTypesId = (
  projects: CollectionEntry<'project'>[]
): Record<string, CollectionEntry<'project'>[] | undefined> => {
  return groupBy(projects, p => p.data.typesId ?? 'personal')
}

/** returns all technologies created from projects (inc duplicate technologies)
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getAllTechnologies = (projects: CollectionEntry<'project'>[]) => {
  return projects.flatMap(project => [...project.data.technologies])
}

/** returns all unique technologies created from projects
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getUniqueTechnologies = (projects: CollectionEntry<'project'>[]) => {
  return [...new Set(getAllTechnologies(projects))]
}

/** Returns an array of strings, ordered by the number of times each technology is used in all the projects
 * Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */

export const getTechnologiesByUsage = (projects: CollectionEntry<'project'>[]) => {
  const techCount = new Map<string, number>()

  for (const tech of getAllTechnologies(projects)) {
    techCount.set(tech, (techCount.get(tech) ?? 0) + 1)
  }

  return [...techCount.entries()]
    .sort((a, b) => b[1] - a[1]) // sort by usage count, descending
    .map(([tech]) => tech) // return only the technology names
}

/** Builds the schema.org CollectionPage + ItemList structured data for a project list page. */
export const createProjectCollectionSchema = (
  name: string,
  path: string,
  projects: CollectionEntry<'project'>[],
  site: URL | undefined
): Record<string, unknown> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: new URL(path, site).href,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        '@type': 'ListItem',
        name: project.data.title,
        position: index + 1,
        url: new URL(getPortfolioPath(project.id), site).href
      }))
    }
  }
}

/** returns a count of each unique Technology - [[TechnologyName, count], ...]
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getUniqueTechnologiesWithCount = (projects: CollectionEntry<'project'>[]): [string, number][] => {
  return [
    ...getAllTechnologies(projects).reduce(
      (acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1), new Map<string, number>()
    )
  ].sort((a, b) => b[1] - a[1])
}
