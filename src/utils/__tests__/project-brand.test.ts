import {
  DEFAULT_PROJECT_BRAND,
  getProjectBrandStyle,
  getProjectColorContrast,
  getProjectGradientMinimumContrast,
  getReadableProjectColor,
  getReadableProjectGradientColors,
  MINIMUM_PROJECT_TEXT_CONTRAST,
  PROJECT_DARK_CANVAS,
  PROJECT_LIGHT_CANVAS
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
    expect(style).toContain('--project-title-primary-readable:')
    expect(style).toContain('--project-title-secondary-readable:')
    expect(style).toContain('--project-title-primary-readable-dark:')
    expect(style).toContain('--project-title-secondary-readable-dark:')
  })

  test('derives readable project colors for light and dark surfaces', () => {
    const lightReadable = getReadableProjectColor('#f49e0e', PROJECT_LIGHT_CANVAS)
    const darkReadable = getReadableProjectColor('#27153e', PROJECT_DARK_CANVAS)

    expect(getProjectColorContrast(lightReadable, PROJECT_LIGHT_CANVAS))
      .toBeGreaterThanOrEqual(MINIMUM_PROJECT_TEXT_CONTRAST)
    expect(getProjectColorContrast(darkReadable, PROJECT_DARK_CANVAS))
      .toBeGreaterThanOrEqual(MINIMUM_PROJECT_TEXT_CONTRAST)
  })

  test.each([
    { background: PROJECT_LIGHT_CANVAS, theme: 'light' },
    { background: PROJECT_DARK_CANVAS, theme: 'dark' }
  ])('keeps the Smith Commerce title gradient readable in $theme mode', ({ background }) => {
    const [primary, secondary] = getReadableProjectGradientColors(
      '#ff5c00',
      '#f8f7f3',
      background
    )

    expect(getProjectGradientMinimumContrast(primary, secondary, background))
      .toBeGreaterThanOrEqual(MINIMUM_PROJECT_TEXT_CONTRAST)
  })

  test.each([
    { background: PROJECT_LIGHT_CANVAS, first: '#ffffff', second: '#f8f7f3' },
    { background: PROJECT_DARK_CANVAS, first: '#000000', second: '#110c1d' }
  ])('makes extreme low-contrast gradients readable', ({ background, first, second }) => {
    const [readableFirst, readableSecond] = getReadableProjectGradientColors(
      first,
      second,
      background
    )

    expect(getProjectGradientMinimumContrast(readableFirst, readableSecond, background))
      .toBeGreaterThanOrEqual(MINIMUM_PROJECT_TEXT_CONTRAST)
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
