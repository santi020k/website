import { getTechnologyPath, getTechnologySlug } from '@/utils/links'

import { resumeSkillGroups } from '@/data/resume'
import type { Locale } from '@/i18n'
import type { pageTranslator } from '@/i18n/page-copy'

type PageTranslate = ReturnType<typeof pageTranslator>

/** Files whose history decides the résumé page's `dateModified`. */
export const resumeHistoryPaths = [
  'scripts/py/cv.md',
  'src/content/project',
  'src/data/resume.ts',
  'src/loaders/resume.ts',
  'src/pages/resume.astro',
  'src/site.config.ts'
]

/** Skill labels link to their technology archive when a project uses that technology. */
export const getResumeSkillGroups = (t: PageTranslate, projectTechnologies: readonly string[]) => {
  const technologySlugs = new Set(projectTechnologies.map(getTechnologySlug))

  return resumeSkillGroups.map(group => ({
    title: t(group.title),
    skills: group.skills.map(skill => {
      let label: string
      let technology: string

      if (typeof skill === 'string') {
        label = skill

        technology = skill
      } else if ('labelKey' in skill) {
        label = t(skill.labelKey)

        technology = label
      } else {
        label = skill.name

        technology = skill.technology
      }

      const href = technologySlugs.has(getTechnologySlug(technology)) ? getTechnologyPath(technology) : undefined

      return { label, href }
    })
  }))
}

export const getResumeSummary = (locale: Locale, t: PageTranslate, years: number) => (locale === 'es' ?
  `Líder de ingeniería y arquitecto full-stack con más de ${years} años construyendo productos sólidos, ` :
  `Engineering leader and full-stack architect with ${years}+ years building resilient products, `) +
  t('page.modernizingFrontendSystemsAndHelpingTeams')
