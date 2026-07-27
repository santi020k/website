import { getFormattedDate } from './date'

type ProjectType = 'experimental' | 'personal' | 'professional' | undefined

const getMonthDifference = (startDate: Date, endDate: Date): number => {
  const years = endDate.getFullYear() - startDate.getFullYear()
  const months = endDate.getMonth() - startDate.getMonth()
  const totalMonths = years * 12 + months

  return Math.max(1, totalMonths + (endDate.getDate() >= startDate.getDate() ? 1 : 0))
}

const key = (type: ProjectType): 'experimental' | 'personal' | 'professional' => type ?? 'professional'

const PROJECT_TYPE_META = {
  personal: {
    typeLabel: 'Personal project',
    featuredLabel: 'Personal project',
    notesLabel: 'Project notes',
    notesDescription: 'A closer look at the design decisions, technical choices, and problems this project was built to solve.',
    relatedHeading: 'More projects in a similar lane.',
    focusLabel: 'Open source, community work, and practical developer experience.',
    stageActive: 'Active project',
    stageCompleted: 'Completed project',
    scopeHighlights: [
      'Knowledge sharing and public problem-solving',
      'Developer tooling, community, and reusability',
      'Low-friction adoption for real teams'
    ]
  },
  experimental: {
    typeLabel: 'Experimental work',
    featuredLabel: 'Featured experiment',
    notesLabel: 'Experiment notes',
    notesDescription: 'A closer look at the hypothesis, the approach taken, and what the experiment revealed.',
    relatedHeading: 'More experiments in a similar lane.',
    focusLabel: 'Experiments in product direction, tooling, and interaction design.',
    stageActive: 'Active experiment',
    stageCompleted: 'Completed experiment',
    scopeHighlights: [
      'New ideas tested quickly and clearly',
      'Prototypes shaped by learning, not polish theater',
      'Useful signals for what to double down on next'
    ]
  },
  professional: {
    typeLabel: 'Professional work',
    featuredLabel: 'Featured work',
    notesLabel: 'Work notes',
    notesDescription: 'A closer look at the delivery decisions, technical tradeoffs, and product constraints behind this work.',
    relatedHeading: 'More work in a similar lane.',
    focusLabel: 'Architecture, delivery leadership, and product quality under real constraints.',
    stageActive: 'Active work',
    stageCompleted: 'Completed work',
    scopeHighlights: [
      'Architecture that survives real delivery pressure',
      'Cross-functional work across product, design, and engineering',
      'Performance, quality, and developer experience improvements'
    ]
  }
} as const

export const getProjectTypeLabel = (type: ProjectType): string => PROJECT_TYPE_META[key(type)].typeLabel

export const getProjectStageLabel = (type: ProjectType, endingDate?: Date): string => {
  const meta = PROJECT_TYPE_META[key(type)]

  return endingDate ? meta.stageCompleted : meta.stageActive
}

export const getProjectFeaturedLabel = (type: ProjectType): string => PROJECT_TYPE_META[key(type)].featuredLabel

export const getProjectNotesLabel = (type: ProjectType): string => PROJECT_TYPE_META[key(type)].notesLabel

export const getProjectNotesDescription = (type: ProjectType): string => PROJECT_TYPE_META[key(type)].notesDescription

export const getProjectRelatedHeading = (type: ProjectType): string => PROJECT_TYPE_META[key(type)].relatedHeading

export const getProjectFocusLabel = (type: ProjectType): string => PROJECT_TYPE_META[key(type)].focusLabel

export const getProjectScopeHighlights = (type: ProjectType): string[] => [
  ...PROJECT_TYPE_META[key(type)].scopeHighlights
]

export const getProjectTimelineLabel = (startingDate: Date, endingDate?: Date): string => {
  const startLabel = getFormattedDate(startingDate, { day: undefined, month: 'short', year: 'numeric' })
  const endLabel = endingDate ? getFormattedDate(endingDate, { day: undefined, month: 'short', year: 'numeric' }) : 'Present'

  return `${startLabel} - ${endLabel}`
}

export const getProjectDateRangeLabel = (startingDate: Date, endingDate?: Date): string => {
  const startYear = startingDate.getFullYear()
  const endYear = endingDate?.getFullYear()

  if (!endYear || startYear === endYear) return String(startYear)

  return `${startYear} - ${endYear}`
}

export const getProjectDurationLabel = (startingDate: Date, endingDate?: Date): string => {
  const totalMonths = getMonthDifference(startingDate, endingDate ?? new Date())

  if (totalMonths < 12) return `${totalMonths} mo`

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (months === 0) return `${years} yr${years === 1 ? '' : 's'}`

  return `${years} yr${years === 1 ? '' : 's'} ${months} mo`
}
