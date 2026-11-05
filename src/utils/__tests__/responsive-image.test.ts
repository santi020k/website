import { describe, expect, test } from 'vitest'

import { getResponsiveImageDimensions } from '../responsive-image'

describe('getResponsiveImageDimensions', () => {
  test('caps large covers while preserving their aspect ratio', () => {
    expect(getResponsiveImageDimensions({ width: 2400, height: 1350 }, 1600, [400, 800, 1200])).toEqual({
      width: 1600,
      height: 900,
      widths: [400, 800, 1200, 1600]
    })
  })

  test('does not upscale a source smaller than every candidate', () => {
    expect(getResponsiveImageDimensions({ width: 240, height: 360 }, 1600, [400, 800, 1200])).toEqual({
      width: 240,
      height: 360,
      widths: [240]
    })
  })

  test('includes an intermediate source width and rounds fractional heights', () => {
    expect(getResponsiveImageDimensions({ width: 1200, height: 801 }, 960, [320, 480, 640, 800])).toEqual({
      width: 960,
      height: 641,
      widths: [320, 480, 640, 800, 960]
    })
  })

  test('sorts and deduplicates candidates without changing the supplied list', () => {
    const candidates = [1600, 400, 800, 400, 2400]

    expect(getResponsiveImageDimensions({ width: 2000, height: 1000 }, 1600, candidates).widths)
      .toEqual([400, 800, 1600])
    expect(candidates).toEqual([1600, 400, 800, 400, 2400])
  })

  test('keeps the target when no candidates are supplied', () => {
    expect(getResponsiveImageDimensions({ width: 700, height: 350 }, 1600, []).widths).toEqual([700])
  })
})
