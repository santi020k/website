import type { CollectionEntry } from 'astro:content'

import { getTechnologySlug } from '@/utils/links'

import { describe, expect, test } from 'vitest'

import {
  getAllTechnologies,
  getUniqueTechnologies,
  getUniqueTechnologiesWithCount
} from '../project'

const makeProject = (
  overrides: Partial<CollectionEntry<'project'>['data']> & { id?: string } = {}
): CollectionEntry<'project'> => {
  const { id = 'project-1', ...data } = overrides

  return {
    id,
    collection: 'project',
    data: {
      brand: { primary: '#620ae6', secondary: '#b78cff', surface: '#10091c' },
      description: 'A project',
      endingDate: undefined,
      draft: false,
      impactMetrics: [],
      relevanceWeight: 0,
      startingDate: new Date('2022-01-01'),
      technologies: [],
      title: 'Project',
      typesId: 'professional',
      updatedDate: undefined,
      ...data
    }
  }
}

interface TechnologyInput {
  name: string
  technologies: string[][]
}

// Mirrors scripts/js/generate-og-images.js, which always labels the ci-cd slug as CI/CD.
const ciCdInputs: TechnologyInput[] = [
  { name: 'CI-CD before CI/CD', technologies: [['CI-CD'], ['CI/CD']] },
  { name: 'CI/CD before CI-CD', technologies: [['CI/CD'], ['CI-CD']] },
  { name: 'only CI-CD', technologies: [['CI-CD'], ['CI-CD']] }
]

const makeProjects = (technologies: string[][]) => technologies.map((projectTechnologies, index) => makeProject({
  id: `project-${index + 1}`,
  technologies: projectTechnologies
}))

// ─── getAllTechnologies ───────────────────────────────────────────────────────

describe('getAllTechnologies', () => {
  test('returns a flat list of all technologies including duplicates', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })

    expect(getAllTechnologies([p1, p2])).toEqual(['React', 'TypeScript', 'TypeScript', 'Node.js'])
  })

  test('returns an empty array when no projects have technologies', () => {
    const p = makeProject({ technologies: [] })
    expect(getAllTechnologies([p])).toEqual([])
  })

  test('returns an empty array for empty input', () => {
    expect(getAllTechnologies([])).toEqual([])
  })
})

// ─── getUniqueTechnologies ────────────────────────────────────────────────────

describe('getUniqueTechnologies', () => {
  test('deduplicates technologies across projects', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })

    const result = getUniqueTechnologies([p1, p2])

    expect(result).toContain('React')
    expect(result).toContain('TypeScript')
    expect(result).toContain('Node.js')
    expect(result).toHaveLength(3)
  })

  test('returns an empty array when all projects have no technologies', () => {
    expect(getUniqueTechnologies([makeProject({ technologies: [] })])).toEqual([])
  })

  test.each(ciCdInputs)('labels the ci-cd slug as CI/CD for $name', ({ technologies }) => {
    const result = getUniqueTechnologies(makeProjects(technologies))

    expect(result).toEqual(['CI/CD'])
    expect(result.map(getTechnologySlug)).toEqual(['ci-cd'])
  })

  test('prefers the NPM label for the npm slug', () => {
    const result = getUniqueTechnologies(makeProjects([['npm'], ['NPM']]))

    expect(result).toEqual(['NPM'])
    expect(result.map(getTechnologySlug)).toEqual(['npm'])
  })
})

// ─── getUniqueTechnologiesWithCount ──────────────────────────────────────────

describe('getUniqueTechnologiesWithCount', () => {
  test('returns [technology, count] tuples sorted by count descending', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })
    const p3 = makeProject({ technologies: ['TypeScript'] })

    const result = getUniqueTechnologiesWithCount([p1, p2, p3])
    const typescriptEntry = result.find(([t]) => t === 'TypeScript')

    expect(typescriptEntry).toEqual(['TypeScript', 3])
    expect(result[0]?.[0]).toBe('TypeScript')
  })

  test('returns an empty array for empty input', () => {
    expect(getUniqueTechnologiesWithCount([])).toEqual([])
  })

  test.each(ciCdInputs)('counts every ci-cd mention under CI/CD for $name', ({ technologies }) => {
    const result = getUniqueTechnologiesWithCount(makeProjects(technologies))

    expect(result).toEqual([['CI/CD', 2]])
    expect(result.map(([technology]) => getTechnologySlug(technology))).toEqual(['ci-cd'])
  })

  test('labels the ci-cd group CI/CD alongside other technologies', () => {
    const result = getUniqueTechnologiesWithCount(makeProjects([['CI-CD', 'TypeScript'], ['CI/CD', 'TypeScript'], ['TypeScript']]))

    expect(result).toEqual([['TypeScript', 3], ['CI/CD', 2]])
  })

  test('prefers the NPM label for the npm slug', () => {
    const result = getUniqueTechnologiesWithCount(makeProjects([['npm'], ['NPM']]))

    expect(result).toEqual([['NPM', 2]])
  })
})
