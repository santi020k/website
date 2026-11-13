import type { CollectionEntry } from 'astro:content'

type Project = Pick<CollectionEntry<'project'>, 'id'>

/** Collection ids without a trailing `/index`, matching how pages and data files name projects. */
export const projectKey = (project: Project) => project.id.replace(/\/index$/u, '')

/**
 * Returns a lookup by project id. A missing id is a broken page, so the lookup throws
 * with `context` naming the page that asked.
 */
export const projectLookup = <T extends Project>(projects: readonly T[], context: string) => {
  const byId = new Map(projects.map(project => [projectKey(project), project]))

  return (id: string): T => {
    const project = byId.get(id)

    if (!project) throw new Error(`Missing ${context} project: ${id}`)

    return project
  }
}

/** Picks projects by id, in the order given. */
export const selectProjects = <T extends Project>(projects: readonly T[], ids: readonly string[], context: string) => {
  const lookup = projectLookup(projects, context)

  return ids.map(lookup)
}
