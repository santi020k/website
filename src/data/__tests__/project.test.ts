import type { CollectionEntry } from 'astro:content'

import { describe, expect, it, vi } from 'vitest'

import {
  getAllTechnologies,
  getTechnologiesByUsage,
  getUniqueTechnologies,
  getUniqueTechnologiesWithCount,
  groupProjectsByTypesId,
  groupProjectsByYear
} from '../project'

vi.mock('@/utils/content', () => ({
  getCachedProjects: vi.fn().mockResolvedValue([])
}))

const makeProject = (
  overrides: Partial<CollectionEntry<'project'>['data']> & { id?: string } = {}
): CollectionEntry<'project'> => {
  const { id = 'project-1', ...data } = overrides

  return {
    id,
    data: {
      description: 'A project',
      draft: false,
      impactMetrics: [],
      startingDate: new Date('2022-01-01'),
      technologies: [],
      title: 'Project',
      typesId: 'professional',
      ...data
    }
  } as unknown as CollectionEntry<'project'>
}

// ─── groupProjectsByYear ──────────────────────────────────────────────────────

describe('groupProjectsByYear', () => {
  it('groups projects into buckets keyed by starting year', () => {
    const p2021 = makeProject({ id: 'a', startingDate: new Date('2021-06-01') })
    const p2022a = makeProject({ id: 'b', startingDate: new Date('2022-03-01') })
    const p2022b = makeProject({ id: 'c', startingDate: new Date('2022-11-01') })

    const result = groupProjectsByYear([p2021, p2022a, p2022b])

    expect(result['2021']).toHaveLength(1)
    expect(result['2022']).toHaveLength(2)
  })

  it('returns an empty object for an empty input', () => {
    expect(groupProjectsByYear([])).toEqual({})
  })

  it('does not include keys for years that have no projects', () => {
    const p = makeProject({ startingDate: new Date('2023-06-01') })
    const result = groupProjectsByYear([p])

    expect(Object.keys(result)).toEqual(['2023'])
  })

  it('does not mutate the input array', () => {
    const p = makeProject({ startingDate: new Date('2020-06-01') })
    const input = [p]
    groupProjectsByYear(input)
    expect(input).toHaveLength(1)
  })
})

// ─── groupProjectsByTypesId ───────────────────────────────────────────────────

describe('groupProjectsByTypesId', () => {
  it('groups projects by their typesId', () => {
    const professional = makeProject({ id: 'a', typesId: 'professional' })
    const personal = makeProject({ id: 'b', typesId: 'personal' })
    const experimental = makeProject({ id: 'c', typesId: 'experimental' })

    const result = groupProjectsByTypesId([professional, personal, experimental])

    expect(result.professional).toHaveLength(1)
    expect(result.personal).toHaveLength(1)
    expect(result.experimental).toHaveLength(1)
  })

  it('defaults to "personal" when typesId is absent', () => {
    const noType = makeProject({ id: 'x', typesId: undefined })
    const result = groupProjectsByTypesId([noType])

    expect(result.personal).toHaveLength(1)
  })

  it('returns an empty object for an empty input', () => {
    expect(groupProjectsByTypesId([])).toEqual({})
  })

  it('accumulates multiple projects under the same typesId', () => {
    const p1 = makeProject({ id: 'a', typesId: 'professional' })
    const p2 = makeProject({ id: 'b', typesId: 'professional' })
    const result = groupProjectsByTypesId([p1, p2])

    expect(result.professional).toHaveLength(2)
  })
})

// ─── getAllTechnologies ───────────────────────────────────────────────────────

describe('getAllTechnologies', () => {
  it('returns a flat list of all technologies including duplicates', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })

    expect(getAllTechnologies([p1, p2])).toEqual(['React', 'TypeScript', 'TypeScript', 'Node.js'])
  })

  it('returns an empty array when no projects have technologies', () => {
    const p = makeProject({ technologies: [] })
    expect(getAllTechnologies([p])).toEqual([])
  })

  it('returns an empty array for empty input', () => {
    expect(getAllTechnologies([])).toEqual([])
  })
})

// ─── getUniqueTechnologies ────────────────────────────────────────────────────

describe('getUniqueTechnologies', () => {
  it('deduplicates technologies across projects', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })

    const result = getUniqueTechnologies([p1, p2])

    expect(result).toContain('React')
    expect(result).toContain('TypeScript')
    expect(result).toContain('Node.js')
    expect(result).toHaveLength(3)
  })

  it('returns an empty array when all projects have no technologies', () => {
    expect(getUniqueTechnologies([makeProject({ technologies: [] })])).toEqual([])
  })
})

// ─── getUniqueTechnologiesWithCount ──────────────────────────────────────────

describe('getUniqueTechnologiesWithCount', () => {
  it('returns [technology, count] tuples sorted by count descending', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })
    const p3 = makeProject({ technologies: ['TypeScript'] })

    const result = getUniqueTechnologiesWithCount([p1, p2, p3])
    const typescriptEntry = result.find(([t]) => t === 'TypeScript')

    expect(typescriptEntry).toEqual(['TypeScript', 3])
    expect(result[0]?.[0]).toBe('TypeScript')
  })

  it('returns an empty array for empty input', () => {
    expect(getUniqueTechnologiesWithCount([])).toEqual([])
  })
})

// ─── getTechnologiesByUsage ───────────────────────────────────────────────────

describe('getTechnologiesByUsage', () => {
  it('returns technology names sorted by usage count descending', () => {
    const p1 = makeProject({ technologies: ['React', 'TypeScript'] })
    const p2 = makeProject({ technologies: ['TypeScript', 'Node.js'] })

    const result = getTechnologiesByUsage([p1, p2])

    expect(result[0]).toBe('TypeScript')
    expect(result).toContain('React')
    expect(result).toContain('Node.js')
  })

  it('returns only technology names (no counts)', () => {
    const p = makeProject({ technologies: ['React'] })
    const result = getTechnologiesByUsage([p])

    expect(result).toEqual(['React'])
  })

  it('returns an empty array for empty input', () => {
    expect(getTechnologiesByUsage([])).toEqual([])
  })
})
