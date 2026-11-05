import { technologyInterestPatterns, technologyInterestWeights } from '@/data/technology-metadata'

const normalizeTechnology = (technology: string) => technology.trim().toLowerCase().replace(/\s+/g, ' ')

export const getTechnologyInterestScore = (technology: string): number => {
  const normalizedTechnology = normalizeTechnology(technology)
  const explicitWeight = technologyInterestWeights.get(normalizedTechnology)

  if (typeof explicitWeight === 'number') {
    return explicitWeight
  }

  const matchedPattern = technologyInterestPatterns.find(({ pattern }) => pattern.test(normalizedTechnology))

  if (matchedPattern) {
    return matchedPattern.score
  }

  return 18
}

export const sortTechnologiesByInterest = (
  technologies: string[]
): string[] => [...technologies].sort((leftTechnology, rightTechnology) => {
  const scoreDifference =
    getTechnologyInterestScore(rightTechnology) - getTechnologyInterestScore(leftTechnology)

  if (scoreDifference !== 0) {
    return scoreDifference
  }

  return leftTechnology.localeCompare(rightTechnology, undefined, { sensitivity: 'base' })
})

export const sortTechnologyCountsByInterest = (
  technologies: [string, number][]
): [string, number][] => [...technologies].sort((leftTechnology, rightTechnology) => {
  const scoreDifference =
    getTechnologyInterestScore(rightTechnology[0]) - getTechnologyInterestScore(leftTechnology[0])

  if (scoreDifference !== 0) {
    return scoreDifference
  }

  const usageDifference = rightTechnology[1] - leftTechnology[1]

  if (usageDifference !== 0) {
    return usageDifference
  }

  return leftTechnology[0].localeCompare(rightTechnology[0], undefined, { sensitivity: 'base' })
})
