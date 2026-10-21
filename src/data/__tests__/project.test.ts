import type { CollectionEntry } from 'astro:content'

import { describe, expect, test } from 'vitest'

import {
  getAllTechnologies,
  getTechnologiesByUsage,
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
})

// ─── getTechnologiesByUsage ───────────────────────────────────────────────────

describe('getTechnologiesByUsage', () => {
  test('returns technology names sorted by usage count descending', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })

    const result = getTechnologiesByUsage([p1, p2])

    expect(result[0]).toBe('TypeScript')
    expect(result).toContain('React')
    expect(result).toContain('Node.js')
  })

  test('returns only technology names (no counts)', () => {
    const p = makeProject({ technologies: ['React'] })
    const result = getTechnologiesByUsage([p])

    expect(result).toEqual(['React'])
  })

  test('returns an empty array for empty input', () => {
    expect(getTechnologiesByUsage([])).toEqual([])
  })
})
