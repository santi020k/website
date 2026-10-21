import { getPortfolioMetricDisplay, getProjectOutcomeDisplay } from '@/utils/portfolio-metric'

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

describe('project outcome display', () => {
  test('keeps the direction and both values of explicit changes', () => {
    expect(getProjectOutcomeDisplay('Lighthouse score improved from 35 to 98')).toEqual({ label: 'Lighthouse score improved', previous: '35', value: '98' })
    expect(getProjectOutcomeDisplay('Coverage improved from 70.5% to 99%')).toEqual({ label: 'Coverage improved', previous: '70.5%', value: '99%' })
    expect(getProjectOutcomeDisplay('Time to Interactive dropped by 75%')).toEqual({ label: 'Time to Interactive dropped', value: '75%' })
  })

  test.each([
    ['100% accessibility score on the rebuilt storefront', '100%', 'Accessibility score on the rebuilt storefront'],
    ['95%+ sprint velocity', '95%+', 'Sprint velocity'],
    ['10+ client launches in the first year', '10+', 'Client launches in the first year'],
    ['30.5% fewer bugs after the front-end migration', '30.5%', 'Fewer bugs after the front-end migration']
  ])('retains the complete context for %s', (summary, value, label) => {
    expect(getProjectOutcomeDisplay(summary)).toEqual({ label, value })
  })

  test.each([
    '',
    'Up to 70% organic traffic growth for selected clients',
    'Caps requested speed at 75% of each fan\'s reported range',
    'Lighthouse score improved from 35 to 98 in one benchmark',
    'Time to Interactive dropped by 75% on selected pages',
    '2019 event sold out',
    'Combines accessible controls and platform-native authoring'
  ])('does not turn qualified claims, dates, or prose into unqualified metrics: %s', summary => {
    expect(getProjectOutcomeDisplay(summary)).toEqual({ label: summary })
  })
})
