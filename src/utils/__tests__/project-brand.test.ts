import {
  DEFAULT_PROJECT_BRAND,
  getProjectBrandStyle,
  getProjectColorContrast,
  getReadableProjectColor
} from '@/utils/project-brand'

import { describe, expect, test } from 'vitest'

describe('project brand utilities', () => {
  test('serializes project palettes as scoped HSL custom properties', () => {
    const style = getProjectBrandStyle({
      primary: '#f49e0e',
      secondary: '#4b5563',
      surface: '#111827'
    })

    expect(style).toContain('--project-primary: 38 91% 51%')
    expect(style).toContain('--project-secondary: 215 14% 34%')
    expect(style).toContain('--project-surface: 221 39% 11%')
    expect(style).toContain('--project-on-surface: 0 0% 100%')
    expect(style).toContain('--project-primary-readable:')
    expect(style).toContain('--project-primary-readable-dark:')
  })

  test('derives readable project colors for light and dark surfaces', () => {
    const lightReadable = getReadableProjectColor('#f49e0e', '#fbf8ff')
    const darkReadable = getReadableProjectColor('#27153e', '#10091c')

    expect(getProjectColorContrast(lightReadable, '#fbf8ff')).toBeGreaterThanOrEqual(4.5)
    expect(getProjectColorContrast(darkReadable, '#10091c')).toBeGreaterThanOrEqual(4.5)
  })

  test('uses the site brand palette when project metadata is unavailable', () => {
    expect(getProjectBrandStyle()).toBe(getProjectBrandStyle(DEFAULT_PROJECT_BRAND))
  })

  test('rejects malformed project colors', () => {
    expect(() => getProjectBrandStyle({
      primary: 'orange',
      secondary: '#4b5563',
      surface: '#111827'
    })).toThrow('Invalid project brand color')
  })
})
