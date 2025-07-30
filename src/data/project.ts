/* eslint-disable func-style */
import { type CollectionEntry, getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export async function getAllProjects(): Promise<CollectionEntry<'project'>[]> {
  return await getCollection('project', ({ data }) => import.meta.env.PROD ? !data.draft : true)
}

/** groups projects by year (based on option siteConfig.sortProjectsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 */
export function groupProjectsByTypesId(projects: CollectionEntry<'project'>[]) {
  return projects.reduce<Record<string, CollectionEntry<'project'>[]>>((acc, project) => {
    const typesId = project?.data?.typesId ?? 'unknown'

    if (!acc[typesId]) {
      acc[typesId] = []
    }

    acc[typesId].push(project)

    return acc
  }, {})
}

/** returns all technologies created from projects (inc duplicate technologies)
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getAllTechnologies(projects: CollectionEntry<'project'>[]) {
  return projects.flatMap(project => [...(project?.data?.technologies ?? [])])
}

/** returns all unique technologies created from projects
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getUniqueTechnologies(projects: CollectionEntry<'project'>[]) {
  return [...new Set(getAllTechnologies(projects))]
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
