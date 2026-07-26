import type { CollectionEntry } from 'astro:content'

import { getCachedProjects } from '@/utils/content'
import { getPortfolioPath, getTechnologySlug } from '@/utils/links'

export const getAllProjects = async (): Promise<CollectionEntry<'project'>[]> => getCachedProjects()

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
): Record<string, CollectionEntry<'project'>[] | undefined> => groupBy(projects, p => p.data.startingDate.getFullYear().toString())

/** Groups projects by typesId. */
export const groupProjectsByTypesId = (
  projects: CollectionEntry<'project'>[]
): Record<string, CollectionEntry<'project'>[] | undefined> => groupBy(projects, p => p.data.typesId ?? 'personal')

/** returns all technologies created from projects (inc duplicate technologies)
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getAllTechnologies = (projects: CollectionEntry<'project'>[]) => projects.flatMap(project => [...project.data.technologies])

/** returns all unique technologies created from projects
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
const groupTechnologyLabels = (technologies: string[]) => {
  const groups = new Map<string, string[]>()

  for (const technology of technologies) {
    const slug = getTechnologySlug(technology)
    const labels = groups.get(slug)

    if (labels) {
      if (!labels.includes(technology)) labels.push(technology)
    } else {
      groups.set(slug, [technology])
    }
  }

  return groups
}

const getPreferredTechnologyLabel = (labels: string[], slug?: string) =>
  slug === 'npm' ? labels.find(label => label === 'NPM') ?? labels[0] ?? '' : labels[0] ?? ''

export const getUniqueTechnologies = (projects: CollectionEntry<'project'>[]) =>
  [...groupTechnologyLabels(getAllTechnologies(projects))]
    .map(([slug, labels]) => getPreferredTechnologyLabel(labels, slug))

/** Returns an array of strings, ordered by the number of times each technology is used in all the projects
 * Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */

export const getTechnologiesByUsage = (projects: CollectionEntry<'project'>[]) => {
  const technologyGroups = groupTechnologyLabels(getAllTechnologies(projects))
  const techCount = new Map<string, number>()

  for (const tech of getAllTechnologies(projects)) {
    const slug = getTechnologySlug(tech)

    techCount.set(slug, (techCount.get(slug) ?? 0) + 1)
  }

  return [...techCount.entries()]
    .sort((a, b) => b[1] - a[1]) // sort by usage count, descending
    .map(([slug]) => getPreferredTechnologyLabel(technologyGroups.get(slug) ?? [], slug))
}

/** Builds the schema.org CollectionPage + ItemList structured data for a project list page. */
export const createProjectCollectionSchema = (
  name: string,
  path: string,
  projects: CollectionEntry<'project'>[],
  site: URL | undefined
): Record<string, unknown> => ({
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
})

/** returns a count of each unique Technology - [[TechnologyName, count], ...]
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getUniqueTechnologiesWithCount = (
  projects: CollectionEntry<'project'>[]
): [string, number][] => {
  const technologies = getAllTechnologies(projects)
  const technologyGroups = groupTechnologyLabels(technologies)
  const counts = technologies.reduce(
    (acc, technology) => {
      const slug = getTechnologySlug(technology)

      return acc.set(slug, (acc.get(slug) ?? 0) + 1)
    },
    new Map<string, number>()
  )

  return [...counts.entries()]
    .map(([slug, count]): [string, number] => [
      getPreferredTechnologyLabel(technologyGroups.get(slug) ?? [], slug),
      count
    ])
    .sort((a, b) => b[1] - a[1])
}
