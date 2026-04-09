/* eslint-disable func-style */
import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export async function getAllProjects(): Promise<CollectionEntry<'project'>[]> {
  return await getCollection('project', ({ data }) => import.meta.env.PROD ? !data.draft : true)
}

/** groups projects by year (based on option siteConfig.sortProjectsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 */
export function groupProjectsByYear(projects: CollectionEntry<'project'>[]) {
  return projects.reduce<Record<string, CollectionEntry<'project'>[] | undefined>>(
    (acc, project) => {
      const year = project.data.startingDate.getFullYear().toString()

      /* eslint-disable security/detect-object-injection */
      acc[year] ??= []

      acc[year].push(project)
      /* eslint-enable security/detect-object-injection */

      return acc
    }, {}
  )
}

/** groups projects by typesId, using the typesId as the key
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 */
export function groupProjectsByTypesId(projects: CollectionEntry<'project'>[]) {
  return projects.reduce<Record<string, CollectionEntry<'project'>[] | undefined>>(
    (acc, project) => {
      const typeId = project.data.typesId ?? 'personal'

      /* eslint-disable security/detect-object-injection */
      acc[typeId] ??= []

      acc[typeId].push(project)
      /* eslint-enable security/detect-object-injection */

      return acc
    }, {}
  )
}

/** returns all technologies created from projects (inc duplicate technologies)
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getAllTechnologies(projects: CollectionEntry<'project'>[]) {
  return projects.flatMap(project => [...project.data.technologies])
}

/** returns all unique technologies created from projects
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getUniqueTechnologies(projects: CollectionEntry<'project'>[]) {
  return [...new Set(getAllTechnologies(projects))]
}

/** Returns an array of strings, ordered by the number of times each technology is used in all the projects
 * Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */

export function getTechnologiesByUsage(projects: CollectionEntry<'project'>[]) {
  const techCount = new Map<string, number>()

  for (const tech of getAllTechnologies(projects)) {
    techCount.set(tech, (techCount.get(tech) ?? 0) + 1)
  }

  return [...techCount.entries()]
    .sort((a, b) => b[1] - a[1]) // sort by usage count, descending
    .map(([tech]) => tech) // return only the technology names
}

/** returns a count of each unique Technology - [[TechnologyName, count], ...]
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getUniqueTechnologiesWithCount(projects: CollectionEntry<'project'>[]): [string, number][] {
  return [
    ...getAllTechnologies(projects).reduce(
      (acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1), new Map<string, number>()
    )
  ].sort((a, b) => b[1] - a[1])
}
