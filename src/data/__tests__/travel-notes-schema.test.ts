import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { load } from 'js-yaml'
import { describe, expect, test } from 'vitest'

import { travelCountries } from '../travel'
import { travelNotesSchema } from '../travel-notes-schema'

describe('country notebook authoring', () => {
  test('keeps unanswered fields distinct from a score of zero', () => {
    expect(travelNotesSchema.parse({ code: 'JP' })).toEqual({
      code: 'JP',
      score: null,
      summary: '',
      visitedWhen: '',
      highlights: [],
      wouldReturn: null,
      language: 'en'
    })
    expect(travelNotesSchema.parse({ code: 'JP', score: 0 }).score).toBe(0)
  })

  test.each([0, 8.5, 10])('accepts a personal score of %s', score => {
    expect(travelNotesSchema.parse({ code: 'JP', score }).score).toBe(score)
  })

  test.each([-0.1, 10.1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '8'])('rejects an invalid score of %s', score => {
    expect(travelNotesSchema.safeParse({ code: 'JP', score }).success).toBe(false)
  })

  test.each(['CA', 'jp', '', 'XX'])('rejects country code %s outside the supplied notebook', code => {
    expect(travelNotesSchema.safeParse({ code }).success).toBe(false)
  })

  test.each(['yes', 'maybe', 'no', null])('accepts return preference %s', wouldReturn => {
    expect(travelNotesSchema.parse({ code: 'JP', wouldReturn }).wouldReturn).toBe(wouldReturn)
  })

  test.each(['always', '', false])('rejects invalid return preference %s', wouldReturn => {
    expect(travelNotesSchema.safeParse({ code: 'JP', wouldReturn }).success).toBe(false)
  })

  test('trims authored text and records its language without inventing dates', () => {
    expect(travelNotesSchema.parse({
      code: 'JP',
      summary: ' A personal memory. ',
      visitedWhen: ' Several visits over the years ',
      highlights: [' A favorite meal '],
      language: 'es'
    })).toMatchObject({
      summary: 'A personal memory.',
      visitedWhen: 'Several visits over the years',
      highlights: ['A favorite meal'],
      language: 'es'
    })
    expect(travelNotesSchema.parse({ code: 'JP', summary: '  ', visitedWhen: '  ' })).toMatchObject({
      summary: '',
      visitedWhen: ''
    })
    expect(travelNotesSchema.safeParse({ code: 'JP', language: 'fr' }).success).toBe(false)
    expect(travelNotesSchema.safeParse({ code: 'JP', highlights: [' '] }).success).toBe(false)
  })

  test('provides one valid country file for each of the 15 confirmed notebook entries', () => {
    const directory = join(process.cwd(), 'src/content/country')
    const files = readdirSync(directory).filter(file => file.endsWith('.md'))
    const entries = files.map(file => {
      expect(file).toMatch(/^[a-z]+(?:-[a-z]+)*\.md$/u)
      const source = readFileSync(join(directory, file), 'utf8')
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(source)?.[1]

      if (frontmatter === undefined) throw new Error(`Missing frontmatter in ${file}`)

      const data: unknown = load(frontmatter)

      return travelNotesSchema.parse(data)
    })

    expect(entries).toHaveLength(15)
    expect(entries.map(entry => entry.code).sort()).toEqual(travelCountries.map(country => country.code).sort())
  })
})
