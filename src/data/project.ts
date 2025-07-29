/* eslint-disable func-style */
import { type CollectionEntry, getCollection } from 'astro:content'

/** filter out draft  based on the environment */
export async function getAllProjects(): Promise<CollectionEntry<'project'>[]> {
  return await getCollection('project', ({ data }) => import.meta.env.PROD ? !data.draft : true)
}

/** groups projects by year (based on option siteConfig.sortProjectsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 */
// export function groupProjectsByStartingYear(projects: CollectionEntry<'project'>[]) {
//   return projects.reduce<Record<string, CollectionEntry<'project'>[]>>((acc, project) => {
//     const year = project?.data?.publishDate?.getFullYear?.() ?? new Date().getFullYear()

//     if (!acc[year]) {
//       acc[year] = []
//     }

//     acc[year]?.push(project)

//     return acc
//   }, {})
// }

/** returns all tags created from projects (inc duplicate tags)
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getAllTags(projects: CollectionEntry<'project'>[]) {
  return projects.flatMap(project => [...(project?.data?.tags ?? [])])
}

/** returns all unique tags created from projects
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getUniqueTags(projects: CollectionEntry<'project'>[]) {
  return [...new Set(getAllTags(projects))]
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft projects, pass it the result of getAllProjects above to do so.
 *  */
export function getUniqueTagsWithCount(projects: CollectionEntry<'project'>[]): [string, number][] {
  return [
    ...getAllTags(projects).reduce(
      (acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1), new Map<string, number>()
    )
  ].sort((a, b) => b[1] - a[1])
}
