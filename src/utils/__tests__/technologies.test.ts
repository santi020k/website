import { describe, expect, it } from 'vitest'

import {
  getTechnologyInterestScore,
  sortTechnologiesByInterest,
  sortTechnologyCountsByInterest
} from '../technologies'

describe('getTechnologyInterestScore', () => {
  it('prioritizes product-shaping technologies over process labels', () => {
    expect(getTechnologyInterestScore('Next.js')).toBeGreaterThan(getTechnologyInterestScore('Team Leadership'))
    expect(getTechnologyInterestScore('TypeScript')).toBeGreaterThan(getTechnologyInterestScore('Scrum'))
  })
})

describe('sortTechnologiesByInterest', () => {
  it('orders technologies from the most interesting to the most supporting', () => {
    expect(
      sortTechnologiesByInterest(['Team Leadership', 'Git', 'Next.js', 'TypeScript', 'CI/CD'])
    ).toEqual(['Next.js', 'TypeScript', 'CI/CD', 'Git', 'Team Leadership'])
  })

  it('does not mutate the original array', () => {
    const technologies = ['Git', 'React.js', 'Storybook']

    sortTechnologiesByInterest(technologies)

    expect(technologies).toEqual(['Git', 'React.js', 'Storybook'])
  })
})

describe('sortTechnologyCountsByInterest', () => {
  it('prefers interest score before falling back to usage count', () => {
    expect(
      sortTechnologyCountsByInterest([
        ['Team Leadership', 9],
        ['ESLint', 3],
        ['Next.js', 1]
      ])
    ).toEqual([
      ['Next.js', 1],
      ['ESLint', 3],
      ['Team Leadership', 9]
    ])
  })
})
