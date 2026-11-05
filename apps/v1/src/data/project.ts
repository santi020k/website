import { type CollectionEntry, getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export const getAllProjects = async (): Promise<CollectionEntry<'project'>[]> => await getCollection('project', ({ data }) => !data.draft)

/** groups projects by year (based on option siteConfig.sortProjectsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 */
export const groupProjectsByYear = (projects: CollectionEntry<'project'>[]) => projects.reduce<Record<string, CollectionEntry<'project'>[] | undefined>>(
  (acc, project) => {
    const year = project.data.startingDate.getFullYear().toString()

    acc[year] ??= []

    acc[year].push(project)

    return acc
  }, {}
)

/** groups projects by typesId, using the typesId as the key
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 */
export const groupProjectsByTypesId = (projects: CollectionEntry<'project'>[]) => projects.reduce<Record<string, CollectionEntry<'project'>[] | undefined>>(
  (acc, project) => {
    const typeId = project.data.typesId ?? 'personal'

    acc[typeId] ??= []

    acc[typeId].push(project)

    return acc
  }, {}
)

/** returns all technologies created from projects (inc duplicate technologies)
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getAllTechnologies = (projects: CollectionEntry<'project'>[]) => projects.flatMap(project => [...project.data.technologies])

/** returns all unique technologies created from projects
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getUniqueTechnologies = (projects: CollectionEntry<'project'>[]) => [...new Set(getAllTechnologies(projects))]

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

/** returns a count of each unique Technology - [[TechnologyName, count], ...]
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export const getUniqueTechnologiesWithCount = (projects: CollectionEntry<'project'>[]): [string, number][] => [
  ...getAllTechnologies(projects).reduce(
    (acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1), new Map<string, number>()
  )
].sort((a, b) => b[1] - a[1])
