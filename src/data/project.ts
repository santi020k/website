import type { CollectionEntry } from 'astro:content'

import { getPortfolioPath, getTechnologySlug } from '@/utils/links'

/** returns all technologies created from projects (inc duplicate technologies)
 *  Note: This function doesn't filter draft projects, pass published entries from getCachedProjects.
 *  */
export const getAllTechnologies = (projects: CollectionEntry<'project'>[]) => projects.flatMap(project => [...project.data.technologies])

/** returns all unique technologies created from projects
 *  Note: This function doesn't filter draft projects, pass published entries from getCachedProjects.
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

// Matches scripts/js/generate-og-images.js, which always labels the ci-cd slug as CI/CD.
const getPreferredTechnologyLabel = (labels: string[], slug?: string) => {
  if (slug === 'ci-cd') return 'CI/CD'

  return slug === 'npm' ? labels.find(label => label === 'NPM') ?? labels[0] ?? '' : labels[0] ?? ''
}

export const getUniqueTechnologies = (projects: CollectionEntry<'project'>[]) => [...groupTechnologyLabels(getAllTechnologies(projects))]
  .map(([slug, labels]) => getPreferredTechnologyLabel(labels, slug))

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
 *  Note: This function doesn't filter draft projects, pass published entries from getCachedProjects.
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
    }, new Map<string, number>()
  )

  return [...counts.entries()]
    .map(([slug, count]): [string, number] => [
      getPreferredTechnologyLabel(technologyGroups.get(slug) ?? [], slug),
      count
    ])
    .sort((a, b) => b[1] - a[1])
}
