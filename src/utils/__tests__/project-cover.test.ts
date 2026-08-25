import { getProjectCoverForUsage } from '@/utils/project-cover'

import { describe, expect, test } from 'vitest'

describe('getProjectCoverForUsage', () => {
  const cover = {
    horizontal: 'hero.webp',
    src: 'thumbnail.webp',
    vertical: 'portrait.webp'
  }

  test.each([
    ['thumbnail', 'thumbnail.webp'],
    ['hero', 'hero.webp'],
    ['portrait', 'portrait.webp']
  ] as const)('selects the %s project image', (usage, expected) => {
    expect(getProjectCoverForUsage(cover, usage)).toBe(expected)
  })

  test('falls back to the thumbnail when a purpose-built variant is unavailable', () => {
    expect(getProjectCoverForUsage({ src: 'thumbnail.webp' }, 'hero')).toBe('thumbnail.webp')
    expect(getProjectCoverForUsage({ src: 'thumbnail.webp' }, 'portrait')).toBe('thumbnail.webp')
  })

  test('returns undefined when the project has no cover', () => {
    expect(getProjectCoverForUsage(undefined, 'thumbnail')).toBeUndefined()
  })
})
