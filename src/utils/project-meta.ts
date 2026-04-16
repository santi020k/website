import { getFormattedDate } from './date'

type ProjectType = 'experimental' | 'personal' | 'professional' | undefined

const getMonthDifference = (startDate: Date, endDate: Date): number => {
  const years = endDate.getFullYear() - startDate.getFullYear()
  const months = endDate.getMonth() - startDate.getMonth()
  const totalMonths = years * 12 + months

  return Math.max(1, totalMonths + (endDate.getDate() >= startDate.getDate() ? 1 : 0))
}

export const getProjectTypeLabel = (type: ProjectType): string => {
  if (type === 'personal') return 'Personal project'

  if (type === 'experimental') return 'Experimental work'

  return 'Professional work'
}

export const getProjectStageLabel = (type: ProjectType, endingDate?: Date): string => {
  const completed = Boolean(endingDate)

  if (type === 'personal') return completed ? 'Completed project' : 'Active project'

  if (type === 'experimental') return completed ? 'Completed experiment' : 'Active experiment'

  return completed ? 'Completed work' : 'Active work'
}

export const getProjectFeaturedLabel = (type: ProjectType): string => {
  if (type === 'personal') return 'Featured project'

  if (type === 'experimental') return 'Featured experiment'

  return 'Featured work'
}

export const getProjectNotesLabel = (type: ProjectType): string => {
  if (type === 'personal') return 'Project notes'

  if (type === 'experimental') return 'Experiment notes'

  return 'Work notes'
}

export const getProjectRelatedHeading = (type: ProjectType): string => {
  if (type === 'personal') return 'More projects in a similar lane.'

  if (type === 'experimental') return 'More experiments in a similar lane.'

  return 'More work in a similar lane.'
}

export const getProjectFocusLabel = (type: ProjectType): string => {
  if (type === 'personal') {
    return 'Open source, community work, and practical developer experience.'
  }

  if (type === 'experimental') {
    return 'Experiments in product direction, tooling, and interaction design.'
  }

  return 'Architecture, delivery leadership, and product quality under real constraints.'
}

export const getProjectScopeHighlights = (type: ProjectType): string[] => {
  if (type === 'personal') {
    return [
      'Knowledge sharing and public problem-solving',
      'Developer tooling, community, and reusability',
      'Low-friction adoption for real teams'
    ]
  }

  if (type === 'experimental') {
    return [
      'New ideas tested quickly and clearly',
      'Prototypes shaped by learning, not polish theater',
      'Useful signals for what to double down on next'
    ]
  }

  return [
    'Architecture that survives real delivery pressure',
    'Cross-functional work across product, design, and engineering',
    'Performance, quality, and developer experience improvements'
  ]
}

export const getProjectTimelineLabel = (startingDate: Date, endingDate?: Date): string => {
  const startLabel = getFormattedDate(startingDate, { month: 'short', year: 'numeric' })
  const endLabel = endingDate ? getFormattedDate(endingDate, { month: 'short', year: 'numeric' }) : 'Present'

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

  if (totalMonths < 12) {
    return `${totalMonths} mo`
  }

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (months === 0) {
    return `${years} yr${years === 1 ? '' : 's'}`
  }

  return `${years} yr${years === 1 ? '' : 's'} ${months} mo`
}
