import { describe, expect, test } from 'vitest'

import {
  getTechnologyInterestScore,
  sortTechnologiesByInterest,
  sortTechnologyCountsByInterest
} from '../technologies'

const expectDefined = <T>(value: T | undefined): T => {
  expect(value).toBeDefined()

  if (value === undefined) {
    throw new Error('Expected value to be defined')
  }

  return value
}

// ─── getTechnologyInterestScore ───────────────────────────────────────────────

describe('getTechnologyInterestScore', () => {
  test('returns an explicit high score for React.js', () => {
    expect(getTechnologyInterestScore('React.js')).toBe(140)
  })

  test('is case-insensitive (normalizes to lowercase)', () => {
    expect(getTechnologyInterestScore('REACT.JS')).toBe(140)
    expect(getTechnologyInterestScore('react.js')).toBe(140)
  })

  test('trims surrounding whitespace before lookup', () => {
    expect(getTechnologyInterestScore('  TypeScript  ')).toBe(134)
  })

  test('returns explicit weight for vitest', () => {
    expect(getTechnologyInterestScore('Vitest')).toBe(74)
  })

  test('returns explicit weight for Team Leadership', () => {
    expect(getTechnologyInterestScore('Team Leadership')).toBe(6)
  })

  test('returns a pattern-based score for a technology matched by a regex', () => {
    // "Angular" is not in the explicit map but matches the core-tech pattern → 48
    expect(getTechnologyInterestScore('Angular')).toBe(48)
  })

  test('falls back to the default score (18) for unknown technologies', () => {
    expect(getTechnologyInterestScore('UnknownTech9000')).toBe(18)
  })

  test('product-shaping technologies score higher than process labels', () => {
    expect(getTechnologyInterestScore('Next.js')).toBeGreaterThan(getTechnologyInterestScore('Team Leadership'))
    expect(getTechnologyInterestScore('TypeScript')).toBeGreaterThan(getTechnologyInterestScore('Scrum'))
  })
})

// ─── sortTechnologiesByInterest ───────────────────────────────────────────────

describe('sortTechnologiesByInterest', () => {
  test('orders technologies from highest to lowest interest score', () => {
    expect(
      sortTechnologiesByInterest(['Team Leadership', 'Git', 'Next.js', 'TypeScript', 'CI/CD'])
    ).toEqual(['Next.js', 'TypeScript', 'CI/CD', 'Git', 'Team Leadership'])
  })

  test('applies alphabetical tiebreaking when two technologies share the same score', () => {
    // "Turborepo" and "NX" both have score 58 in the explicit map
    const result = sortTechnologiesByInterest(['NX', 'Turborepo'])
    expect(result).toEqual(['NX', 'Turborepo'])
  })

  test('does not mutate the original array', () => {
    const original = ['Git', 'React.js', 'Storybook']
    sortTechnologiesByInterest(original)
    expect(original).toEqual(['Git', 'React.js', 'Storybook'])
  })

  test('handles an empty array', () => {
    expect(sortTechnologiesByInterest([])).toEqual([])
  })

  test('handles a single technology', () => {
    expect(sortTechnologiesByInterest(['TypeScript'])).toEqual(['TypeScript'])
  })
})

// ─── sortTechnologyCountsByInterest ───────────────────────────────────────────

describe('sortTechnologyCountsByInterest', () => {
  test('prefers interest score before falling back to usage count', () => {
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

  test('uses usage count as a tiebreaker when scores are equal', () => {
    // Both "UnknownA" and "UnknownB" fall through to the default score (18)
    const result = sortTechnologyCountsByInterest([
      ['UnknownA', 2],
      ['UnknownB', 5]
    ])
    const first = expectDefined(result[0])
    const second = expectDefined(result[1])
    // Higher count wins the tiebreaker
    expect(first[0]).toBe('UnknownB')
    expect(second[0]).toBe('UnknownA')
  })

  test('uses alphabetical order as final tiebreaker when score and count are equal', () => {
    const result = sortTechnologyCountsByInterest([
      ['Zebra', 1],
      ['Alpha', 1]
    ])
    const first = expectDefined(result[0])
    const second = expectDefined(result[1])
    // Equal score and count → alphabetical ascending
    expect(first[0]).toBe('Alpha')
    expect(second[0]).toBe('Zebra')
  })

  test('does not mutate the original array', () => {
    const original: [string, number][] = [['React.js', 3], ['Docker', 1]]
    sortTechnologyCountsByInterest(original)
    expect(original).toEqual([['React.js', 3], ['Docker', 1]])
  })

  test('handles an empty array', () => {
    expect(sortTechnologyCountsByInterest([])).toEqual([])
  })
})
