import { getPortfolioMetricDisplay } from '@/utils/portfolio-metric'

import { describe, expect, test } from 'vitest'

describe('portfolio metric display', () => {
  test('presents an explicit before and after without changing its values', () => {
    expect(getPortfolioMetricDisplay('Lighthouse score improved from 35 to 98')).toEqual({ label: 'Lighthouse score', value: '35 → 98' })
    expect(getPortfolioMetricDisplay('Coverage improved from 70.5% to 99%')).toEqual({ label: 'Coverage', value: '70.5% → 99%' })
  })

  test('preserves the measure and the exact percentage reduction', () => {
    expect(getPortfolioMetricDisplay('Time to Interactive dropped by 75%')).toEqual({ label: 'Time to Interactive', value: '75% less' })
  })

  test.each([
    'Connects web and native interfaces through shared tokens',
    'Up to 70% organic traffic growth for selected clients',
    'Time to Interactive dropped by 75% on selected pages',
    'Lighthouse score improved from 35 to 98 in one benchmark',
    'Latency dropped by 20 milliseconds'
  ])('retains the complete statement when formatting would omit context: %s', metric => {
    expect(getPortfolioMetricDisplay(metric)).toEqual({ label: metric })
  })
})
