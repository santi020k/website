import { describe, expect, test } from 'vitest'

import { projectLookup, selectProjects } from '../projects'
import { sortTalks, withPublishedPostCount } from '../speaking'

describe('project selection', () => {
  const projects = [{ id: 'void' }, { id: 'pads/index' }, { id: 'xgames' }]

  test('keeps the requested order and accepts ids with or without /index', () => {
    expect(selectProjects(projects, ['xgames', 'pads', 'void'], 'test').map(project => project.id))
      .toEqual(['xgames', 'pads/index', 'void'])
  })

  test('names the page when an id is missing', () => {
    expect(() => projectLookup(projects, 'résumé')('nope')).toThrow('Missing résumé project: nope')
  })
})

describe('speaking talks', () => {
  test('sorts newest first, dated talks before undated ones in the same year, then by order', () => {
    const talks = [
      { id: 'a', date: undefined, order: 2, year: 2019 },
      { id: 'b', date: new Date('2019-03-01T00:00:00Z'), order: 1, year: 2019 },
      { id: 'c', date: undefined, order: 1, year: 2019 },
      { id: 'd', date: new Date('2023-06-01T00:00:00Z'), order: 0, year: 2023 }
    ]

    expect(sortTalks(talks).map(talk => talk.id)).toEqual(['d', 'c', 'a', 'b'])
  })

  test('replaces only the published-writing highlight with the live post count', () => {
    const highlights = [{ label: 'Talks', value: '8' }, { label: 'Published writing', value: '0' }]

    expect(withPublishedPostCount(highlights, 'Published writing', 42))
      .toEqual([{ label: 'Talks', value: '8' }, { label: 'Published writing', value: '42' }])
  })
})

describe('résumé skill groups', () => {
  test('links skills to technology archives that exist and translates copy labels', async () => {
    const { getResumeSkillGroups } = await import('../resume')
    const { pageTranslator } = await import('@/i18n/page-copy')
    const groups = getResumeSkillGroups(pageTranslator('es'), ['React.js', 'REST APIs', 'AWS'])
    const skills = new Map(groups.flatMap(group => group.skills).map(skill => [skill.label, skill.href]))

    expect(groups).toHaveLength(3)
    expect(skills.get('React.js')).toBe('/technologies/react-js/')
    expect(skills.get('REST')).toBe('/technologies/rest-apis/')
    expect(skills.get('Next.js')).toBeUndefined()
    expect([...skills.keys()]).toContain(pageTranslator('es')('page.systemDesign'))
  })
})
