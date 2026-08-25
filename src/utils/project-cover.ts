export type ProjectCoverUsage = 'background' | 'hero' | 'portrait' | 'thumbnail'

interface ProjectCoverVariants<TImage> {
  background?: TImage
  horizontal?: TImage
  src: TImage
  vertical?: TImage
}

export const getProjectCoverForUsage = <TImage>(
  cover: ProjectCoverVariants<TImage> | undefined,
  usage: ProjectCoverUsage
): TImage | undefined => {
  if (!cover) return undefined

  if (usage === 'background') return cover.background ?? cover.horizontal ?? cover.src

  if (usage === 'hero') return cover.horizontal ?? cover.src

  if (usage === 'portrait') return cover.vertical ?? cover.src

  return cover.src
}
